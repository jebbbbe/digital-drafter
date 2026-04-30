import * as THREE from "three"
import { TransformTree, createTransformNode } from "./TransformTree"
import { InstanceCount } from "./capacity"
import { InstancedLineSegments } from "../objects/meshes/InstancedLineSegments"
import {
    setInstanceMatrixAt,
    createLinkedInstanceMatrixTexture,
    doublePositionBuffer,
    setDataTextureMatrixAt,
} from "../objects/buffers/buffers"
import { calculateProjectionMatrix, applyTransformAroundOrigin } from "./matrix"
import { InstancedProjectionMaterial } from "../objects/materials/InstancedProjectionMaterial"
import { Line2 } from "three/examples/jsm/Addons.js"
import { settings } from "../settings"
import * as rand from "../utils/random"

type instanceItem = {
    // brush:any for CSG later...
    geometry: THREE.BufferGeometry
    localTransform: THREE.Matrix4 // matches head of tree baseTransform..?
    buffers: {
        matrix: THREE.InstancedBufferAttribute
        dataTexture: THREE.DataTexture
        parentIDs: THREE.InstancedBufferAttribute
    }
    group: THREE.Group
    instances: {
        mesh: THREE.InstancedMesh
        line: InstancedLineSegments<THREE.LineBasicMaterial>
        proj: InstancedLineSegments<InstancedProjectionMaterial>
    }
    count: number
    maxCount: number
}

// instance updates
function incrementInstanceCount(instance: instanceItem): void {
    instance.count++
    setInstanceCount(instance)
}
function decrementInstanceCount(instance: instanceItem): void {
    instance.count--
    setInstanceCount(instance)
}
function setInstanceCount(instance: instanceItem, count?: number): void {
    if (count) instance.count = count
    instance.instances.mesh.count = instance.count
    instance.instances.line.count = instance.count
    instance.instances.proj.count = instance.count
}

export class Drafter {
    tree!: TransformTree
    scene!: THREE.Scene
    instanceItems!: instanceItem[]
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
        // projection: new THREE.LineBasicMaterial({
        //     color: 0x00ff00,
        // }),
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
        initalPoints: { pos: THREE.Vector3; parent?: number }[] = [
            { pos: new THREE.Vector3() },
        ]
    ) {
        this.tree = new TransformTree()
        this.scene = scene
        this.instanceItems = []

        // weak setup
        this.newInstance(initalGeo)
        for (let i = 0; i < initalPoints.length; i++) {
            const wip = initalPoints[i]
            this.addNode(0, wip?.parent, wip.pos)
        }

        //debug set up
        this.debug.objects.line.material = this.materials.debugLine
        this.debug.objects.point.material = this.materials.debugPoint
    }
    newInstance(geometry: THREE.BufferGeometry): instanceItem {
        const newID = this.instanceItems.length

        // localTransform set from geo or pass in...
        // i think the roots base needs to be this..?
        const scale = 1.0 //rand.random(0.5, 1.25)
        const localTransform = new THREE.Matrix4().scale(
            new THREE.Vector3(scale, scale, scale)
        )
        // .makeRotationX(
        //     rand.randomItem([0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2])
        // )

        const newInstanceItem = createInstanceItem(
            geometry,
            localTransform,
            this.materials,
            newID
        )
        setInstanceCount(newInstanceItem, 0)

        this.scene.add(newInstanceItem.group)
        this.instanceItems.push(newInstanceItem)

        return newInstanceItem
    }
    removeInstance() {}
    addNode(
        id: number,
        parentIndex: number | undefined,
        point: THREE.Vector3 = new THREE.Vector3()
    ) {
        const instanceItem = this.instanceItems[id]

        if (instanceItem.count === instanceItem.maxCount) {
            console.error("not implemented resize instance item")
            return
        }

        const parent =
            typeof parentIndex === "number"
                ? this.tree.findNode({ id, index: parentIndex })
                : undefined

        const node = createTransformNode({ id, pos: point })
        this.tree.addNode(node, parent)

        const previousPosition = parent ? parent.position : new THREE.Vector3()

        calculateProjectionMatrix(
            previousPosition,
            node.position,
            node.baseMatrix
        )

        let mat
        if (parent) {
            node.compoundMatrix
                .copy(node.baseMatrix)
                .multiply(parent.compoundMatrix)
        }
        mat = node.compoundMatrix

        // unsure about the implementation of localMatrix...
        applyTransformAroundOrigin(
            node.position,
            instanceItem.localTransform,
            node.compoundMatrix,
            node.localMatrix
        )
        mat = node.localMatrix

        // update buffers
        const index = instanceItem.count
        setInstanceMatrixAt(instanceItem.buffers.matrix, index, mat)
        setDataTextureMatrixAt(instanceItem.buffers.dataTexture, index, mat)

        if (parent && typeof parentIndex === "number") {
            ;(instanceItem.buffers.parentIDs.array as Int8Array)[index] =
                parentIndex
        }

        // inc count to draw visible.
        incrementInstanceCount(instanceItem)
    }
    pruneNode() {}
    removeNode() {}
    patchInstance() {}
}

function createInstanceItem(
    geometry: THREE.BufferGeometry,
    localTransform: THREE.Matrix4,
    materials: any,
    id: number
): instanceItem {
    // create instances
    const mesh = new THREE.InstancedMesh(
        geometry,
        materials.mesh,
        InstanceCount
    )

    const edges = new THREE.EdgesGeometry(geometry, 30)
    const line = new InstancedLineSegments<THREE.LineBasicMaterial>(
        edges,
        materials.line,
        InstanceCount
    )

    const extrude = doublePositionBuffer(edges.clone())
    const projMaterial = materials.projection.clone()
    const proj = new InstancedLineSegments<InstancedProjectionMaterial>(
        extrude,
        projMaterial,
        InstanceCount
    )

    //match shared instanceMatrix
    const instanceMatrix = mesh.instanceMatrix
    line.instanceMatrix = instanceMatrix
    // proj instance matrix must be identiy or we have to do more maths in the shader...
    // proj.instanceMatrix = instanceMatrix
    const parentIDs = new THREE.InstancedBufferAttribute(
        new Int8Array(InstanceCount),
        1
    )
    extrude.setAttribute("lookupIndex", parentIDs)
    const dataTexture = createLinkedInstanceMatrixTexture(instanceMatrix)
    projMaterial.instanceMatrixTexture = dataTexture

    // userdata for raycast lookups
    // copy all info to isntancces.
    mesh.userData.id = id
    line.userData = mesh.userData
    proj.userData = mesh.userData

    const group = new THREE.Group()
    group.add(mesh)
    group.add(line)
    group.add(proj)

    return {
        geometry: geometry,
        localTransform,
        buffers: {
            matrix: instanceMatrix,
            dataTexture,
            parentIDs,
        },
        group,
        instances: {
            mesh,
            line,
            proj,
        },
        count: 0,
        maxCount: InstanceCount,
    }
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
new instanceItem
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
