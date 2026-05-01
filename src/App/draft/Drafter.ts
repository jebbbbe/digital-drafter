import * as THREE from "three"
import { settings } from "../settings"
import { TransformTree } from "./TransformTree"
import { createTransformNode, type TransformNode } from "./TransformNode"
import {
    setInstanceMatrixAt,
    setUintAttributeAt,
    updateBufferRanges,
} from "../objects/buffers/buffers"
import { calculateProjectionMatrix } from "./matrix"
import { InstancedProjectionMaterial } from "../objects/materials/InstancedProjectionMaterial"
import { Line2 } from "three/examples/jsm/Addons.js"
import type { InstanceItem } from "./InstanceItem"
import {
    createInstanceItem,
    setInstanceCount,
    incrementInstanceCount,
    decrementInstanceCount,
} from "./InstanceItem"
import type { NodeLocation } from "./TransformTree"
import * as rand from "../utils/random"

export class Drafter {
    tree!: TransformTree
    scene!: THREE.Scene
    instanceItems!: InstanceItem[]
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
    constructor(scene: THREE.Scene) {
        this.scene = scene
        this.instanceItems = []
        this.tree = new TransformTree()

        //debug set up
        this.debug.objects.line.material = this.materials.debugLine
        this.debug.objects.point.material = this.materials.debugPoint
    }
    newInstance(
        geometry: THREE.BufferGeometry,
        localTransform: THREE.Matrix4 = new THREE.Matrix4()
    ): InstanceItem {
        const newInstanceItem = createInstanceItem(
            geometry,
            localTransform,
            this.materials,
            this.instanceItems.length
        )
        this.scene.add(newInstanceItem.group)
        this.instanceItems.push(newInstanceItem)
        return newInstanceItem
    }
    removeInstance() {}
    addNode(
        parentLocation: NodeLocation = { id: -1, index: -1 },
        partialNode: Partial<TransformNode>
    ) {
        const id = parentLocation.id
        const instanceItem = this.instanceItems[id]

        if (instanceItem.count === instanceItem.maxCount) {
            console.error("not implemented resize instance item")
            return
        }
        if (instanceItem === undefined) {
            console.error("cound nott find InstanceItem")
            return
        }
        // copy parents location to partialNode, unless we defined it already
        // this is so we can add Nodes that use a different bucket id
        if (partialNode.locaiton?.id === undefined) {
            partialNode.locaiton = {
                id: parentLocation.id,
                index: partialNode.locaiton?.index ?? -1,
            }
        }

        const node = createTransformNode(partialNode)
        const parent = this.tree.findNode(parentLocation)
        this.tree.addNode(node, parent)

        // dfs( node, instanceItem)
        // iter(node, instanceItem)
        iter(node, this.instanceItems)
        //
        function iter(node: TransformNode, instanceItems: InstanceItem[]) {
            const isRoot = node.parent === node
            const instanceItem = instanceItems[node.locaiton.id]

            if (isRoot) {
                node.baseMatrix.identity()
                node.compoundMatrix.copy(instanceItem.localTransform)
            } else {
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
            const index = instanceItem.count
            setInstanceMatrixAt(
                instanceItem.buffers.instanceMatrix,
                index,
                node.compoundMatrix
            )
            setUintAttributeAt(
                instanceItem.buffers.parentIDs,
                index,
                node.parent.locaiton.index
            )
            updateBufferRanges(index, instanceItem.buffers)
            // inc count to draw visible.
            incrementInstanceCount(instanceItem)
        }
    }
    pruneNode() {}
    removeNode() {}
    patchInstance() {}
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
