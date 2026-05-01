import * as THREE from "three"
import { settings } from "../settings"
import { TransformTree } from "./TransformTree"
import { createTransformNode } from "./TransformNode"
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
import * as rand from "../utils/random"

export class Drafter {
    tree!: TransformTree
    scene!: THREE.Scene
    InstanceItems!: InstanceItem[]
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
    constructor(
        scene: THREE.Scene,
        initalGeo: THREE.BufferGeometry,
        initalPoints: { pos: THREE.Vector3; parent: number }[] = [
            { pos: new THREE.Vector3(), parent: 0 },
        ]
    ) {
        this.tree = new TransformTree()
        this.scene = scene
        this.InstanceItems = []

        // weak setup
        this.newInstance(initalGeo)
        for (let i = 0; i < initalPoints.length; i++) {
            const wip = initalPoints[i]
            this.addNode(0, wip.parent, wip.pos)
        }

        //debug set up
        this.debug.objects.line.material = this.materials.debugLine
        this.debug.objects.point.material = this.materials.debugPoint
    }
    newInstance(geometry: THREE.BufferGeometry): InstanceItem {
        const newID = this.InstanceItems.length

        // localTransform set from geo or pass in...
        // i think the roots base needs to be this..?
        const scale = rand.random(0.75, 1.5)
        const localTransform = new THREE.Matrix4()
            .makeRotationX(
                rand.randomItem([0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2])
                // rand.random(0, Math.PI * 2)
            )
            .scale(new THREE.Vector3(scale, scale, scale))

        const newInstanceItem = createInstanceItem(
            geometry,
            localTransform,
            this.materials,
            newID
        )
        setInstanceCount(newInstanceItem, 0)

        this.scene.add(newInstanceItem.group)
        this.InstanceItems.push(newInstanceItem)

        return newInstanceItem
    }
    removeInstance() {}
    addNode(
        id: number,
        parentIndex: number,
        point: THREE.Vector3 = new THREE.Vector3()
    ) {
        const InstanceItem = this.InstanceItems[id]

        if (InstanceItem.count === InstanceItem.maxCount) {
            console.error("not implemented resize instance item")
            return
        }

        const node = createTransformNode({ id, pos: point })
        const parent =
            parentIndex >= 0
                ? this.tree.findNode({ id, index: parentIndex })
                : undefined

        this.tree.addNode(node, parent)

        const isRoot = node.parent === node

        if (isRoot) {
            node.baseMatrix.identity()
            node.compoundMatrix.copy(InstanceItem.localTransform)
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
        const index = InstanceItem.count
        setInstanceMatrixAt(
            InstanceItem.buffers.instanceMatrix,
            index,
            node.compoundMatrix
        )
        setUintAttributeAt(
            InstanceItem.buffers.parentIDs,
            index,
            node.parent.instanceLookup.index
        )
        updateBufferRanges(index, InstanceItem.buffers)

        // inc count to draw visible.
        incrementInstanceCount(InstanceItem)
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
