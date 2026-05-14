import * as THREE from "three"
import { TransformTree } from "./TransformTree"
import { createTransformNode, type TransformNode } from "./TransformNode"
import {
    setInstanceMatrixAt,
    setUintAttributeAt,
    updateBufferRanges,
} from "../objects/buffers/buffers"
import { FreeList } from "../objects/FreeList"
import { calculateProjectionMatrix } from "./matrix"
import type { InstanceItem } from "./InstanceItem"
import {
    createInstanceItem,
    incrementInstanceCount,
    decrementInstanceCount,
    computeBoundingSphere,
} from "./InstanceItem"
import type { NodeLocation } from "./TransformTree"
import { walkSubtree } from "./recursive"
import { GlobalTreeTexture } from "../objects/textures/GlobalTreeTexture"
import { matlib } from "./materialManager"

export class Drafter {
    tree = new TransformTree()
    instanceItems: FreeList<InstanceItem> = new FreeList()
    interactivObjects: THREE.Object3D[] = []
    scene!: THREE.Scene
    globalTreeTexture = new GlobalTreeTexture({})
    materials = {
        ...matlib,
        debugLine: new THREE.LineBasicMaterial({
            color: 0xffff00,
        }),
        debugPoint: new THREE.PointsMaterial({
            color: 0xffff00,
        }),
    }
    debug = {
        objects: {
            line: new THREE.Line(),
            point: new THREE.Points(),
        },
        enable: true,
    }

    constructor(scene: THREE.Scene, debug: boolean = false) {
        this.scene = scene
        this.assignTexture()
        if (debug) this.setUpDebug()
    }
    assignTexture() {
        try {
            const text = this.globalTreeTexture.texture
            const size = this.globalTreeTexture.textureSize
            this.materials.mesh.treeData = text
            this.materials.line.treeData = text
            this.materials.dash.treeData = text
            this.materials.projection.treeData = text
            this.materials.fold.treeData = text
            this.materials.mesh.treeDataSize = size
            this.materials.line.treeDataSize = size
            this.materials.dash.treeDataSize = size
            this.materials.projection.treeDataSize = size
            this.materials.fold.treeDataSize = size
            for (let i = 0; i < this.instanceItems.length; i++) {
                const instanceItem = this.instanceItems[i]
                if (!instanceItem) continue
                // @ts-ignore
                instanceItem.instances.line.material.treeData = text
                // @ts-ignore
                instanceItem.instances.line.material.treeDataSize = size
            }
        } catch {}
    }

    setUpDebug() {
        this.debug.enable = true
        this.debug.objects.line.material = this.materials.debugLine
        this.debug.objects.point.material = this.materials.debugPoint
    }

    newInstance(geometry: THREE.BufferGeometry): InstanceItem | undefined {
        // get next avaliable index from freelist
        const id = this.instanceItems.nextIndex()
        //reserve space
        const grew = this.globalTreeTexture.incBlockCount()
        if (grew === -1) {
            console.error("reached max Instances")
            return
        }
        if (grew) this.assignTexture()
        // create new InstanceItem
        const newInstanceItem = createInstanceItem(geometry, this.materials, id)
        // add Geo to the Scene
        this.scene.add(newInstanceItem.group)
        // push to Freelist, should arrive at id
        this.instanceItems.push(newInstanceItem)
        // push to interactive objects
        this.interactivObjects.push(newInstanceItem.instances.mesh)
        // create new node freelist bucket, id should match the instanceitems
        const treeId = this.tree.addBucket()
        if (id !== treeId) {
            console.error("id missmatch on new instance", id, treeId)
        }

        return newInstanceItem
    }

    patchInstance() {
        // todo
        // use to update geometries.
        // not sure best interface yet.
    }

    findReusableInstance(
        geometry: THREE.BufferGeometry,
        preferredId?: number
    ): { id: number; instanceItem: InstanceItem } | undefined {
        if (preferredId !== undefined) {
            const preferred = this.instanceItems[preferredId]
            if (
                preferred &&
                preferred.geometry === geometry &&
                preferred.count < preferred.maxCount
            ) {
                return { id: preferredId, instanceItem: preferred }
            }
        }

        for (let id = 0; id < this.instanceItems.length; id++) {
            const instanceItem = this.instanceItems[id]
            if (!instanceItem) continue
            if (instanceItem.geometry !== geometry) continue
            if (instanceItem.count >= instanceItem.maxCount) continue
            return { id, instanceItem }
        }
    }

    removeInstance(id: number) {
        // get item
        const instanceItem = this.instanceItems[id]
        // nothign to delete
        if (!instanceItem) return

        // clean up other refrences
        this.scene.remove(instanceItem.group)
        const rm = this.interactivObjects.indexOf(instanceItem.instances.mesh)
        if (rm !== -1) {
            this.interactivObjects.splice(rm, 1)
        }
        // remove from both freelists,
        this.instanceItems.remove(id)
        this.tree.removeBucket(id)
        this.globalTreeTexture.decBlockCount()
        // todo
        // we will need to remove all node children located in another freelist id,
        // we can implement when we atart to have this with geo csg brush
    }

    addRootNode(rootNode: Partial<TransformNode>) {
        // get id for insertion
        const id = rootNode?.location?.id
        if (id === undefined || rootNode?.location === undefined) {
            console.log("rootnode missing location", rootNode)
            return
        }

        let instanceItem = this.instanceItems[id]
        if (!instanceItem) {
            console.error("couldnt find instanceItem at id", rootNode)
            return
        }

        if (instanceItem.count === instanceItem.maxCount) {
            const reusable = this.findReusableInstance(
                instanceItem.geometry,
                id
            )
            if (reusable) {
                rootNode.location.id = reusable.id
                instanceItem = reusable.instanceItem
            } else {
                // create new Instance object with same props...
                rootNode.location.id = this.instanceItems.nextIndex()
                instanceItem = this.newInstance(instanceItem.geometry)
                if (!instanceItem) {
                    return
                }
            }
        }

        // make node
        const node = createTransformNode(rootNode)
        // add node to tree
        this.tree.addNode(node)
        // add node to root set
        this.tree.roots.add(node)

        // increment count
        incrementInstanceCount(instanceItem)

        // this should be wrong
        node.baseMatrix.makeTranslation(node.position)
        node.compoundMatrix
            .copy(node.baseMatrix)
            .multiply(instanceItem.localTransform)

        const slot = this.setNodeTextureAt(node)
        setInstanceBuffersIndex(instanceItem, node, slot)

        // update matrix
        computeBoundingSphere(instanceItem)
    }

    // i dont like parentLocation, switch to passing another node...
    addLeafNode(
        partialNode: Partial<TransformNode>,
        parentLocation: NodeLocation | TransformNode = { id: -1, index: -1 }
    ): TransformNode | undefined {
        const parentNodeLocation =
            "location" in parentLocation
                ? parentLocation.location
                : parentLocation
        // copy parents location to partialNode, unless we defined it already
        // this is so we can add Nodes that use a different id
        if (partialNode.location?.id === undefined) {
            partialNode.location = {
                id: parentNodeLocation.id,
                index: partialNode.location?.index ?? -1,
            }
        }

        const id = partialNode.location.id
        let instanceItem = this.instanceItems[id]
        if (!instanceItem) {
            console.error("couldnt find instanceItem at id", partialNode)
            return
        }

        if (instanceItem.count === instanceItem.maxCount) {
            const reusable = this.findReusableInstance(
                instanceItem.geometry,
                id
            )
            if (reusable) {
                partialNode.location.id = reusable.id
                instanceItem = reusable.instanceItem
            } else {
                // create new Instance object with same props...
                partialNode.location.id = this.instanceItems.nextIndex()
                instanceItem = this.newInstance(instanceItem.geometry)
                if (!instanceItem) {
                    return
                }
            }
        }

        const node = createTransformNode(partialNode)
        const parent = this.tree.findNode(parentNodeLocation)
        this.tree.addNode(node, parent)

        incrementInstanceCount(instanceItem)
        // applyNodeMatrixUpdate(node, this.instanceItems)
        calculateBaseMatrix(node)
        calculateCompoundMatrix(node)

        const slot = this.setNodeTextureAt(node)
        setInstanceBuffersIndex(instanceItem, node, slot)
        computeBoundingSphere(instanceItem)

        // console.log("addLeafNode")
        // console.log({node})
        // console.log({parent})
        return node
    }
    pruneNode(target: TransformNode | NodeLocation) {
        //get location
        const location = "location" in target ? target.location : target
        const id = location.id
        //get instanceItem
        const instanceItem = this.instanceItems[id]
        if (!instanceItem) {
            console.error("couldnt find instanceItem at id", location)
            return
        }
        //get node
        const node = this.tree.findNode(location) as TransformNode | undefined
        if (!node) return

        //isRoot branch
        const isRoot = node === node.parent
        if (isRoot) {
            this.removeNode(node)
            return
        }

        const removedIndex = node.location.index
        const parentLocation = node.parent.location
        const parentNode = this.tree.findNode(parentLocation) as TransformNode
        const lastActiveIndex = instanceItem.count - 1
        const swappedNode =
            removedIndex === lastActiveIndex
                ? undefined
                : (this.tree.getBucket(id)?.[lastActiveIndex] as
                      | TransformNode
                      | undefined)

        // reparent the children
        this.tree.pruneNode(node)
        decrementInstanceCount(instanceItem)

        if (swappedNode) {
            // The packed tree moved this node into the removed slot, so rewrite
            // its instance data using the node's new location.
            this.updatePatchedNode(swappedNode)
        }
        this.updatePatchedNode(parentNode)
    }
    removeNode(target: TransformNode | NodeLocation) {
        const location = "location" in target ? target.location : target
        const node = this.tree.findNode(location) as TransformNode | undefined
        if (!node) return

        const subtree: TransformNode[] = []
        const subtreeSet = new Set<TransformNode>()
        walkSubtree(node, (subtreeNode) => {
            subtree.push(subtreeNode)
            subtreeSet.add(subtreeNode)
        })

        const touchedIds = new Set<number>()
        const emptyIds = new Set<number>()
        const movedNodes = new Set<TransformNode>()

        for (let i = subtree.length - 1; i >= 0; i--) {
            const subtreeNode = subtree[i]
            const id = subtreeNode.location.id
            const instanceItem = this.instanceItems[id]
            if (!instanceItem) continue

            const removedIndex = subtreeNode.location.index
            const lastActiveIndex = instanceItem.count - 1
            const swappedNode =
                removedIndex === lastActiveIndex
                    ? undefined
                    : (this.tree.getBucket(id)?.[lastActiveIndex] as
                          | TransformNode
                          | undefined)

            this.tree.removeNode(subtreeNode)
            decrementInstanceCount(instanceItem)
            touchedIds.add(id)

            if (instanceItem.count === 0) {
                emptyIds.add(id)
                continue
            }

            if (swappedNode && !subtreeSet.has(swappedNode)) {
                movedNodes.add(swappedNode)
            }
        }

        for (const id of emptyIds) {
            this.removeInstance(id)
            touchedIds.delete(id)
        }

        for (const movedNode of movedNodes) {
            this.updatePatchedNode(movedNode)
        }

        for (const id of touchedIds) {
            const instanceItem = this.instanceItems[id]
            if (!instanceItem) continue
            computeBoundingSphere(instanceItem)
        }
    }
    /* path node props directly before passing, this updates draw geo*/
    updatePatchedNode(patchedNode: TransformNode) {
        //
        const instanceItem = this.instanceItems[patchedNode.location.id]
        if (!instanceItem) {
            console.error("couldnt find instanceItem at id", patchedNode)
            return
        }

        calculateBaseMatrix(patchedNode)
        //update childrens base matrix as it depends on parent pos.

        const subtree: TransformNode[] = []

        const fn = (n: TransformNode) => calculateCompoundMatrix(n, subtree)

        walkSubtree(patchedNode, fn)

        const sphereUpdate = {} as Record<number, InstanceItem>
        // update buffers of subtree
        for (let i = 0; i < subtree.length; i++) {
            const node = subtree[i]
            const id = node.location.id
            const instanceItem = this.instanceItems[id]
            if (!instanceItem) continue
            const slot = this.setNodeTextureAt(node)
            setInstanceBuffersIndex(instanceItem, node, slot)
            sphereUpdate[id] = instanceItem
        }

        //  update bounding sphere of seen instanceItems
        for (const key in sphereUpdate) {
            computeBoundingSphere(sphereUpdate[key])
        }
    }
    setNodeTextureAt(node: TransformNode) {
        const slot = this.globalTreeTexture.getSlot(node.location)
        const parentSlot = this.globalTreeTexture.getSlot(node.parent.location)
        const update = [
            ...node.compoundMatrix.elements,
            parentSlot,
            0, // not in use yet
            0,
            0,
        ] as any // 20 elem list...
        this.globalTreeTexture.writeMatrix(slot, update)
        return slot
    }
}

const _matrixPosition = new THREE.Vector3()
const _matrixQuaternion = new THREE.Quaternion()
const _matrixScale = new THREE.Vector3()

function calculateBaseMatrix(node: TransformNode) {
    const isRoot = node.parent === node

    if (isRoot) {
        // prettier-ignore
        node.baseMatrix.decompose(_matrixPosition, _matrixQuaternion, _matrixScale)
        node.baseMatrix.compose(node.position, _matrixQuaternion, _matrixScale)
    } else {
        calculateProjectionMatrix(
            node.parent.position,
            node.position,
            node.baseMatrix
        )
    }
    //update direct childrens base matrix as it depends on parent pos.
    const children = node.children
    for (let i = 0; i < children.length; i++) {
        calculateBaseMatrixChild(children[i])
    }
}

function calculateBaseMatrixChild(node: TransformNode) {
    // cant be a root by definition
    calculateProjectionMatrix(
        node.parent.position,
        node.position,
        node.baseMatrix
    )
}

function calculateCompoundMatrix(
    node: TransformNode,
    subTree: TransformNode[] = []
) {
    subTree.push(node)

    const isRoot = node.parent === node

    if (isRoot) {
        node.compoundMatrix.copy(node.baseMatrix)
    } else {
        node.compoundMatrix
            .copy(node.baseMatrix)
            .multiply(node.parent.compoundMatrix)
    }
}

function setInstanceBuffersIndex(
    instanceItem: InstanceItem,
    node: TransformNode,
    slot: number
) {
    const index = node.location.index
    // update matrix buffer
    setInstanceMatrixAt(
        instanceItem.buffers.instanceMatrix,
        index,
        node.compoundMatrix
    )
    // update instance slot
    setUintAttributeAt(instanceItem.buffers.nodeSlot, index, slot)
    // set updateRanges for faster gpu patch
    updateBufferRanges(index, instanceItem.buffers)
}

/*
to use instance material, 
no position prop
no matrix prop

raycast gives us instance id, we can tie that into a matrix/ pos lookup. 


do we initalize instances with positions and matrix, or do we push as we add? 
start by initalizing, can reduce down mem later

do we put all points, matrix in seperate arrays to match instance? or in a unifed one..?
either way, to refrence instance, we will needd two indexs
will require specal logic to proegate down another tree item if we dont unify, due to boolean ops




//MOCK 
move instancce
id -> matrix -> mathupdate -> propegate -> setMatrixAt

addInstance
create pos
create matrix
find parent
mathupdate -> propegate -> setMatrixAt
inc instance count

removeInstance
removes a node, and all its children. 

pruneInstance
remove a node, set all its children to its parent
requires propagation update

new instance 
user shape select
new tree item: 
new InstanceItem
place, add to scene.
might have a parent refrence in the case of boolean operations...
will need a way to propegate down?



#  BOOL
boolean op
check bbox intersect... does this work ith instnce? hehe 
for geometries keep a array of csg brushes in mem
have a flag if brush is valid, keep array inline with instance nodes. 

we might need to look up certain meshes to display the boolean ips to the user, I think we should have an edit mode otherwise we have to update all the children..?

for bool ops, two or more nodes must meet, how do we dertemine the parent in the event of a threesome?
how do we effenecgtly chain multiple ops together? 
how do we quickly update this? seems like we will have to updat ethe instance geometry, but mtarix should be ok?... 


# Scale
i want to have an intial scaling matrix per instance 



// tree mock 1

tree = [
[{}],
[{}],
]
s
// tree mock 2



*/
