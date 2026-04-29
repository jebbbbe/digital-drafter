import * as THREE from "three"
import { TransformTree, createTransformNode } from "./TransformTree"
import { InstanceCount } from "./capacity"
import { InstanceLineSegments } from "./Mesh/InstanceLineSegments"
import { calculateProjectionMatrix } from "./matrix"
import { Line2 } from "three/examples/jsm/Addons.js"

type instanceItem = {
    // brush:any for CSG later...
    geometry: THREE.BufferGeometry
    localTransform: THREE.Matrix4
    sharedBuffers: {
        matrix: THREE.InstancedBufferAttribute
    }
    group: THREE.Group
    // maybe we should have a collection of instances, and som funcitons to update them all...?
    mesh: THREE.InstancedMesh
    line: THREE.InstancedMesh | InstanceLineSegments
}

export class Drafter {
    tree!: TransformTree
    scene!: THREE.Scene
    instanceItems!: instanceItem[]
    materials = {
        line: new THREE.LineBasicMaterial({
            color: 0x000000,
            depthTest: true,
        }),
        wireframe: new THREE.MeshBasicMaterial({
            color: 0x000000,
            wireframe: true,
        }),
        mesh: new THREE.MeshBasicMaterial({
            color: 0x5f05f5,
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1,
        }),
    }
    constructor(
        scene: THREE.Scene,
        initalGeo: THREE.BufferGeometry,
        initalPoints: THREE.Vector3[] = [new THREE.Vector3()]
    ) {
        this.tree = new TransformTree()
        this.scene = scene
        this.instanceItems = []

        // weak setup
        this.newInstance(initalGeo)
        for (let i = 0; i < initalPoints.length; i++) {
            this.addNode(0, Math.max(0, i - 1), initalPoints[i])
        }
    }
    newInstance(geometry: THREE.BufferGeometry): instanceItem {
        // localTransform set from geo or pass in...
        const localTransform = new THREE.Matrix4()

        const mesh = new THREE.InstancedMesh(
            geometry,
            this.materials.mesh,
            InstanceCount
        )

        // const line = new THREE.InstancedMesh(
        //     new THREE.EdgesGeometry(geometry),
        //     this.materials.line,
        //     1
        // )

        // const line = new THREE.InstancedMesh(
        //     geometry,
        //     this.materials.wireframe,
        //     1
        // )

        // const line = new InstanceLineSegments(
        //     new THREE.EdgesGeometry(geometry),
        //     this.materials.line,
        //     1
        // )

        // const line = new THREE.Line(
        //     new THREE.EdgesGeometry(geometry),
        //     this.materials.line
        // )

        // const line = new THREE.LineSegments(
        //     new THREE.EdgesGeometry(geometry, 30),
        //     this.materials.line
        // )

        const line = new InstanceLineSegments(
            new THREE.EdgesGeometry(geometry, 30),
            this.materials.line,
            InstanceCount
        )

        //match shared instanceMatrix
        const instanceMatrix = mesh.instanceMatrix
        line.instanceMatrix = instanceMatrix

        // userdata for raycast lookups
        // copy all info to isntancces.
        const id = this.instanceItems.length
        mesh.userData.id = id
        mesh.count = 0
        line.userData = mesh.userData
        line.count = 0

        const group = new THREE.Group()
        group.add(mesh)
        group.add(line)

        const newInstanceItem = {
            geometry: geometry,
            localTransform,
            sharedBuffers: {
                matrix: instanceMatrix,
            },
            group,
            mesh: mesh,
            line: line,
        }

        this.scene.add(group)
        this.instanceItems.push(newInstanceItem)

        return newInstanceItem
    }
    removeInstance() {}
    addNode(
        id: number,
        parentIndex: number,
        point: THREE.Vector3 = new THREE.Vector3()
    ) {
        const { mesh, line } = this.instanceItems[id]

        const parent = this.tree.findNode({ id, index: parentIndex })
        const node = createTransformNode({ id, pos: point })
        this.tree.addNode(node, parent)

        const previousPosition = parent ? parent.position : new THREE.Vector3()

        calculateProjectionMatrix(
            previousPosition,
            node.position,
            node.baseMatrix
        )

        if (parent) {
            node.compoundMatrix
                .copy(node.baseMatrix)
                .multiply(parent.compoundMatrix)
        }
        mesh.setMatrixAt(mesh.count, node.compoundMatrix)

        // inc count
        mesh.count++
        line.count = mesh.count
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
inc insance count

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
