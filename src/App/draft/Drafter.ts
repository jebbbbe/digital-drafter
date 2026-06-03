import * as THREE from "three"
import { TransformTree } from "./TransformTree"
import { createTransformNode, type TransformNode } from "./TransformNode"
import {
    setInstanceMatrixAt,
    setUintAttributeAt,
    updateBufferRanges,
} from "../objects/buffers/buffers"
import { FreeList } from "../objects/FreeList"
import {
    calculateProjectionMatrix,
    calculateMirroredProjectionMatrix,
} from "./matrix"
import type { InstanceItem } from "./InstanceItem"
import {
    createInstanceItem,
    incrementInstanceCount,
    decrementInstanceCount,
    computeBoundingSphere,
} from "./InstanceItem"
import type { NodeLocation } from "./TransformTree"
import { walkSubtree } from "./recursive"
import {
    GlobalTreeTexture,
    getSlotIndex,
} from "../objects/textures/GlobalTreeTexture"
import { activeMaterialLib, matlib } from "./materialManager"
import { SectionCutter } from "../objects/meshes/SectionCutter"
import { brushCleaner } from "../objects/geometries/brushCleaner"
import { DataTextureLineSegmentsGeometry } from "../objects/geometries/DataTextureLineSegmentsGeometry"

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
            section: new THREE.Mesh(),
        },
        enable: false,
    }
    sectionCutter = new SectionCutter(this.materials.section)
    constructor(scene: THREE.Scene, debug: boolean = false) {
        this.scene = scene
        this.assignTexture()
        this.debug.enable = debug
        if (debug) this.setUpDebug()
        const mesh = this.sectionCutter.mesh
        mesh.renderOrder = 4
        this.scene.add(mesh)
        this.interactivObjects.push(mesh)
    }
    assignTexture() {
        try {
            const text = this.globalTreeTexture.texture
            const size = this.globalTreeTexture.textureSize
            this.materials.mesh.treeData = text
            this.materials.line.treeData = text
            this.materials.outline.treeData = text
            this.materials.dash.treeData = text
            this.materials.projection.treeData = text
            this.materials.fold.treeData = text
            this.materials.mesh.treeDataSize = size
            this.materials.line.treeDataSize = size
            this.materials.outline.treeDataSize = size
            this.materials.dash.treeDataSize = size
            this.materials.projection.treeDataSize = size
            this.materials.fold.treeDataSize = size
            for (let i = 0; i < this.instanceItems.length; i++) {
                const instanceItem = this.instanceItems[i]
                if (!instanceItem) continue
                // @ts-ignore
                instanceItem.instances.line.material.treeData = text
                // @ts-ignore
                instanceItem.instances.outline.material.treeData = text
                // @ts-ignore
                instanceItem.instances.line.material.treeDataSize = size
                // @ts-ignore
                instanceItem.instances.outline.material.treeDataSize = size
            }
        } catch {}
    }

    setUpDebug() {
        this.debug.enable = true
        this.debug.objects.line.material = this.materials.debugLine
        this.debug.objects.point.material = this.materials.debugPoint

        const boxDebug = new THREE.Mesh(
            this.sectionCutter.box,
            new THREE.MeshBasicMaterial({
                color: 0x00ffff,
            })
        )
        // const angle = Math.PI/4
        // const move1 = new THREE.Matrix4().makeTranslation(0.5, 0, 0)
        // const scale = new THREE.Matrix4().makeScale(100, 100, 100)
        // const rotate = new THREE.Matrix4().makeRotationY(angle)
        // const move2 = new THREE.Matrix4().makeTranslation(2, 0, -20)
        // sec.matrix.copy(move2).multiply(rotate).multiply(scale).multiply(move1)
        // sec.matrix.multiply(move1)
        boxDebug.matrixAutoUpdate = false
        //@ts-ignore
        this.debug.objects.section = boxDebug
        this.scene.add(boxDebug)
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

    patchInstanceGeometry(
        id: number,
        geometry: THREE.BufferGeometry
    ): InstanceItem | undefined {
        // get item
        const instanceItem = this.instanceItems[id]
        if (!instanceItem) return

        const geometries = brushCleaner(geometry)
        const { mesh, line, outline, dash, proj } = instanceItem.instances
        const nodeSlot = mesh.geometry.getAttribute(
            "nodeSlot"
        ) as THREE.BufferAttribute

        if (activeMaterialLib === "gl_Line") {
            line.geometry.dispose()
            line.geometry = geometries.lineGeometry
            outline.geometry.dispose()
            outline.geometry = geometries.lineGeometry
        } else {
            const nextLineGeometry = new DataTextureLineSegmentsGeometry(
                geometries.lineGeometry
            )
            const nextOutlineGeometry = new DataTextureLineSegmentsGeometry(
                geometries.lineGeometry
            )

            line.geometry.dispose()
            line.geometry = nextLineGeometry
            outline.geometry.dispose()
            outline.geometry = nextOutlineGeometry
            ;(
                line.material as THREE.ShaderMaterial & {
                    segments: THREE.DataTexture | null
                }
            ).segments = nextLineGeometry.dataTexture
            ;(
                outline.material as THREE.ShaderMaterial & {
                    segments: THREE.DataTexture | null
                }
            ).segments = nextOutlineGeometry.dataTexture
        }
        mesh.geometry.dispose()
        mesh.geometry = geometries.meshGeometry
        dash.geometry.dispose()
        dash.geometry = geometries.lineGeometry
        proj.geometry.dispose()
        proj.geometry = geometries.projGeometry
        dash.computeLineDistances()

        //set node slot
        mesh.geometry.setAttribute("nodeSlot", nodeSlot)
        line.geometry.setAttribute("nodeSlot", nodeSlot)
        outline.geometry.setAttribute("nodeSlot", nodeSlot)
        dash.geometry.setAttribute("nodeSlot", nodeSlot)
        proj.geometry.setAttribute("nodeSlot", nodeSlot)

        geometries.brush.matrixAutoUpdate = false
        instanceItem.brush = geometries.brush
        instanceItem.geometry = geometry
        computeBoundingSphere(instanceItem)
        return instanceItem
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
    }
    // findNode(location: NodeLocation): Node | undefined
    findNode(location: NodeLocation) {
        const node = this.tree.findNode(location) as TransformNode | undefined
        return node
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
        // set type
        rootNode.type = "root"

        // make node
        const node = createTransformNode(rootNode)
        // add node to tree
        this.tree.addNode(node)
        // add node to root set
        this.tree.roots.add(node)

        // increment count
        incrementInstanceCount(instanceItem)
        this.updatePatchedNode(node)
        return node
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
        this.updatePatchedNode(node)

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
        walkSubtree(node, (subtreeNode) => {
            subtree.push(subtreeNode)
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

            if (swappedNode) {
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
        return Array.from(emptyIds)
    }

    detachNode(target: TransformNode | NodeLocation) {
        const location = "location" in target ? target.location : target
        const node = this.tree.findNode(location) as TransformNode | undefined
        if (!node) return
        const isRoot = node === node.parent
        // already an orphan
        if (isRoot) return

        const instanceItem = this.instanceItems[location.id]
        if (!instanceItem) return

        const parent = node.parent
        const siblings = parent.children
        const idx = siblings.indexOf(node)
        if (idx === -1) return
        // remove parent
        siblings.splice(idx, 1)
        node.parent = node
        node.type = "root"

        // make base matrix match root pattern
        rebaseDetachedMatrixNodeToRoot(node, instanceItem.localTransform)

        // we dont really need to do dfs as node didnt move...
        // this.updatePatchedNode(node)the
        // we do need to update teh texture to make the proj lines go away
        this.setNodeTextureAt(node)
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
        const fn = (n: TransformNode) =>
            calculateCompoundMatrix(n, subtree, instanceItem.localTransform)

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
        const slot = getSlotIndex(node.location)
        const parentSlot = getSlotIndex(node.parent.location)
        this.globalTreeTexture.writeMatrix(slot, node.compoundMatrix.elements)
        this.globalTreeTexture.writeNodeParent(slot, parentSlot)
        this.globalTreeTexture.sendUpdate(slot)
        return slot
    }
}

const _position = new THREE.Vector3()
const _quaternion = new THREE.Quaternion()
const _scale = new THREE.Vector3()
// prettier-ignore
const _mirrorXZ = new THREE.Matrix4().set(
	1, 0, 0, 0,
	0,-1, 0, 0,
	0, 0, 1, 0,
	0, 0, 0, 1
);

function calculateBaseMatrix(node: TransformNode) {
    calculateBaseMatrixChild(node)
    //update direct childrens base matrix as it depends on parent pos.
    const children = node.children
    for (let i = 0; i < children.length; i++) {
        calculateBaseMatrixChild(children[i])
    }
}

function calculateBaseMatrixChild(node: TransformNode) {
    const projectionType = node.type

    switch (projectionType) {
        case "root":
            node.baseMatrix.decompose(_position, _quaternion, _scale)
            node.baseMatrix.compose(node.position, _quaternion, _scale)
            break
        case "leaf":
            calculateProjectionMatrix(
                node.parent.position,
                node.position,
                node.baseMatrix
            )
            break
        default:
            calculateProjectionMatrix(
                node.parent.position,
                node.position,
                node.baseMatrix
            )
    }
    if (node.mirror) {
        node.baseMatrix.premultiply(_mirrorXZ)
    }
}

function calculateCompoundMatrix(
    node: TransformNode,
    subTree: TransformNode[] = [],
    localTransform: THREE.Matrix4 = new THREE.Matrix4()
) {
    subTree.push(node)

    const isRoot = node.parent === node

    if (isRoot) {
        node.compoundMatrix.copy(node.baseMatrix).multiply(localTransform)
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

const _detachWorldBase = new THREE.Matrix4()
const _detachInverseLocal = new THREE.Matrix4()
const _detachRotation = new THREE.Quaternion()
const _detachScale = new THREE.Vector3()
const _detachUnusedPosition = new THREE.Vector3()

function rebaseDetachedMatrixNodeToRoot(
    node: TransformNode,
    localTransform: THREE.Matrix4
) {
    _detachInverseLocal.copy(localTransform).invert()
    _detachWorldBase.copy(node.compoundMatrix).multiply(_detachInverseLocal)
    _detachWorldBase.decompose(
        _detachUnusedPosition,
        _detachRotation,
        _detachScale
    )
    node.baseMatrix.compose(node.position, _detachRotation, _detachScale)
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
