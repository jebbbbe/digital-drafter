import * as THREE from "three"
import { settings } from "../settings"
import { TransformTree } from "./TransformTree"
import { createTransformNode, type TransformNode } from "./TransformNode"
import {
    setInstanceMatrixAt,
    setUintAttributeAt,
    updateBufferRanges,
} from "../objects/buffers/buffers"
import { FreeList } from "../objects/FreeList"
import { calculateProjectionMatrix } from "./matrix"
import { InstancedProjectionMaterial } from "../objects/materials/InstancedProjectionMaterial"
import { Line2 } from "three/examples/jsm/Addons.js"
import type { InstanceItem } from "./InstanceItem"
import {
    createInstanceItem,
    incrementInstanceCount,
    decrementInstanceCount,
    computeBoundingSphere,
} from "./InstanceItem"
import type { NodeLocation } from "./TransformTree"
import { walkSubtree } from "./recursive"

export class Drafter {
    tree!: TransformTree
    scene!: THREE.Scene
    instanceItems: FreeList<InstanceItem>
    interactivObjects: THREE.Object3D[] = []
    materials = {
        line: new THREE.LineBasicMaterial({
            color: settings.display.line.color,
            visible: settings.display.line.visible,
            // depthTest: true,
        }),
        dash: new THREE.LineDashedMaterial({
            color: settings.display.dash.color,
            visible: settings.display.dash.visible,
            dashSize: 0.05,
            gapSize: 0.01,
            depthTest: false,
        }),
        mesh: new THREE.MeshBasicMaterial({
            color: settings.display.mesh.color,
            visible: settings.display.mesh.visible,
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1,
            // depthWrite: true,
        }),
        // this one needs to be cloned everytime
        projection: new InstancedProjectionMaterial({
            color: settings.display.projection.color,
            visible: settings.display.projection.visible,
        }),
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
        this.instanceItems = new FreeList()
        this.tree = new TransformTree()
        if (debug) this.setUpDebug()
    }

    setUpDebug() {
        this.debug.enable = true
        this.debug.objects.line.material = this.materials.debugLine
        this.debug.objects.point.material = this.materials.debugPoint
    }

    newInstance(geometry: THREE.BufferGeometry): InstanceItem {
        // get next avaliable index from freelist
        const id = this.instanceItems.nextIndex()
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

    removeInstance(id: number) {
        console.warn("not implemented")
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
        // todo
        // we will need to remove all node children located in another freelist id,
        // we can implement when we atart to have this with geo csg brush
    }

    resizeInstance(instance: InstanceItem) {
        // todo
        // implement is this
        // better to reasign geo or adjust it?
        console.warn("resizeInstance not implemented", instance)
    }

    addRootNode(rootNode: Partial<TransformNode>) {
        console.log("addRootNode")
        // get id for insertion
        const id = rootNode?.location?.id
        if (id === undefined) {
            console.log("rootnode missing location", rootNode)
            return
        }

        const instanceItem = this.instanceItems[id]
        if (!instanceItem) {
            console.error("couldnt find instanceItem at id", rootNode)
            return
        }

        if (instanceItem.count === instanceItem.maxCount) {
            this.resizeInstance(instanceItem)
            return
        }

        // make node
        const node = createTransformNode(rootNode)
        // add node to tree
        this.tree.addNode(node)
        // add node to root set
        this.tree.roots.add(node)

        // increment count
        incrementInstanceCount(instanceItem)
        //  this should correctly set the root matrix?
        applyNodeMatrixUpdate(node, this.instanceItems)
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
        const instanceItem = this.instanceItems[id]
        if (!instanceItem) {
            console.error("couldnt find instanceItem at id", partialNode)
            return
        }

        if (instanceItem.count === instanceItem.maxCount) {
            this.resizeInstance(instanceItem)
            return
        }

        const node = createTransformNode(partialNode)
        const parent = this.tree.findNode(parentNodeLocation)
        this.tree.addNode(node, parent)

        incrementInstanceCount(instanceItem)
        applyNodeMatrixUpdate(node, this.instanceItems)
        computeBoundingSphere(instanceItem)

        // console.log("addLeafNode")
        // console.log({node})
        // console.log({parent})

        return node
    }
    pruneNode(target: TransformNode | NodeLocation) {
        //todo
        console.warn("not implemented yet", target)
        return
        /*
        const location = "location" in target ? target.location : target
        const id = location.id
        const instanceItem = this.instanceItems[id]
        if (!instanceItem) {
            console.error("couldnt find instanceItem at id", location)
            return
        }

        // delete from instance material

        decrementInstanceCount(instanceItem)

        // delete from tree
        const node = this.tree.findNode(location)
        if (!node) return
        this.tree.pruneNode(node)
        // recusive dfs

        // if target is a root, remove from tree,root
        */
    }
    removeNode() {
        // removes node from InstanceItem AND tree
        // delete children recusivly
    }
    /* path node props directly before passing, this updates draw geo*/
    updatePatchedNode(patchedNode: TransformNode) {
        const fn = (node: TransformNode) =>
            applyNodeMatrixUpdate(node, this.instanceItems)
        walkSubtree(patchedNode, fn)
        // this wont update childnodes of different id

        const instanceItem = this.instanceItems[patchedNode.location.id]
        if (!instanceItem) {
            console.error("couldnt find instanceItem at id", patchedNode)
            return
        }

        // this leaves stale children, we need to update all that have this ...
        computeBoundingSphere(instanceItem)
    }
}

/*
applies tree based update to TransformNode
updates instances buffers to be draw to screen
*/
function applyNodeMatrixUpdate(
    node: TransformNode,
    instanceItems: FreeList<InstanceItem>
) {
    // we must look up the instance here, as child might have other id
    const instanceItem = instanceItems[node.location.id]
    if (!instanceItem) {
        console.error("couldnt find instanceItem at id", node)
        return
    }

    const isRoot = node.parent === node

    if (!isRoot) {
        calculateProjectionMatrix(
            node.parent.position,
            node.position,
            node.baseMatrix
        )
        node.compoundMatrix
            .copy(node.baseMatrix)
            .multiply(node.parent.compoundMatrix)
    } else {
        node.baseMatrix.makeTranslation(node.position)
        node.compoundMatrix
            .copy(node.baseMatrix)
            .multiply(instanceItem.localTransform)
    }

    // update buffers
    setInstanceBuffersIndex(instanceItem, node)
}

function setInstanceBuffersIndex(
    instanceItem: InstanceItem,
    node: TransformNode
) {
    if (!instanceItem) {
        console.error("couldnt find instanceItem at id", instanceItem)
        return
    }
    const index = node.location.index
    // update matrix buffer
    setInstanceMatrixAt(
        instanceItem.buffers.instanceMatrix,
        index,
        node.compoundMatrix
    )
    // update parent buffer
    setUintAttributeAt(
        instanceItem.buffers.parentIDs,
        index,
        node.parent.location.index
    )
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
