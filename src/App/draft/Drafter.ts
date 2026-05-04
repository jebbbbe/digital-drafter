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
    setInstanceCount,
    incrementInstanceCount,
    decrementInstanceCount,
    computeBoundingSphere,
} from "./InstanceItem"
import type { NodeLocation } from "./TransformTree"
import { walkSubtree } from "./recursive"

export class Drafter {
    tree!: TransformTree
    scene!: THREE.Scene
    instanceItems: FreeList<InstanceItem> // InstanceItem[] = []
    interactivObjects: THREE.Object3D[] = []
    materials = {
        line: new THREE.LineBasicMaterial({
            color: settings.display.line.color,
            depthTest: true,
            visible: settings.display.line.visible,
        }),
        wireframe: new THREE.MeshBasicMaterial({
            color: 0x000000,
            wireframe: true,
        }),
        mesh: new THREE.MeshBasicMaterial({
            color: settings.display.mesh.color,
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1,
            visible: settings.display.mesh.visible,
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
    newInstance(
        geometry: THREE.BufferGeometry,
        localTransform: THREE.Matrix4 = new THREE.Matrix4(),
        init: boolean = true
    ): InstanceItem {
        const id = this.instanceItems.nextIndex()
        const newInstanceItem = createInstanceItem(
            geometry,
            localTransform,
            this.materials,
            id
        )
        this.scene.add(newInstanceItem.group)
        this.instanceItems.push(newInstanceItem)
        this.interactivObjects.push(newInstanceItem.instances.mesh)
        if (init) {
            this.addNode(
                { id, index: 0 },
                {
                    compoundMatrix: localTransform,
                }
            )
        }

        return newInstanceItem
    }
    removeInstance(id: number) {
        // not implemented
        console.warn("not implemented")
        const instanceItem = this.instanceItems[id]
        if (!instanceItem) return

        // clean up other refrences
        this.scene.remove(instanceItem.group)
        const rm = this.interactivObjects.indexOf(instanceItem.instances.mesh)
        if (rm !== -1) {
            this.interactivObjects.splice(rm, 1)
        }
        this.instanceItems.remove(id)
        this.tree.removeBucket(id)
    }
    patchInstance() {}
    addNode(
        parentLocation: NodeLocation = { id: -1, index: -1 },
        partialNode: Partial<TransformNode>
    ): TransformNode | undefined {
        const id = parentLocation.id
        const instanceItem = this.instanceItems[id]
        if (!instanceItem) {
            console.error("couldnt find instanceItem at id", location)
            return
        }

        if (instanceItem.count === instanceItem.maxCount) {
            console.error("not implemented resize instance item")
            return
        }
        if (instanceItem === undefined) {
            console.error("cound not find InstanceItem")
            return
        }
        // copy parents location to partialNode, unless we defined it already
        // this is so we can add Nodes that use a different bucket id
        if (partialNode.location?.id === undefined) {
            partialNode.location = {
                id: parentLocation.id,
                index: partialNode.location?.index ?? -1,
            }
        }

        const node = createTransformNode(partialNode)
        const parent = this.tree.findNode(parentLocation)
        this.tree.addNode(node, parent)

        incrementInstanceCount(instanceItem)
        applyNodeMatrixUpdate(node, this.instanceItems)
        computeBoundingSphere(instanceItem)

        return node
    }
    pruneNode() {}
    removeNode() {}
    /* path node props directly before passing, this updates draw geo*/
    updatePatchedNode(patchedNode: TransformNode) {
        const fn = (node: TransformNode) =>
            applyNodeMatrixUpdate(node, this.instanceItems)
        walkSubtree(patchedNode, fn)
        // this wont update childnodes of different id

        const instanceItem = this.instanceItems[patchedNode.location.id]
        if (!instanceItem) {
            console.error("couldnt find instanceItem at id", location)
            return
        }
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
    }
    // update buffers
    // we cant pass in instance item, must lookup from idx. children might be in other buckets
    const instanceItem = instanceItems[node.location.id]
    if (!instanceItem) {
        console.error("couldnt find instanceItem at id", location)
        return
    }
    const index = node.location.index // instanceItem.count
    setInstanceMatrixAt(
        instanceItem.buffers.instanceMatrix,
        index,
        node.compoundMatrix
    )
    setUintAttributeAt(
        instanceItem.buffers.parentIDs,
        index,
        node.parent.location.index
    )
    updateBufferRanges(index, instanceItem.buffers)
    // inc count to draw visible.
    // incrementInstanceCount(instanceItem)
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
