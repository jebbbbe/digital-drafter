import * as THREE from "three"
import { TransformTree } from "./TransformTree"
import { InstanceCount } from "./capacity"
import { InstanceLineSegments } from "./Mesh/InstanceLineSegments"
import { Line2 } from "three/examples/jsm/Addons.js"

type instanceItem = {
    mesh: THREE.InstancedMesh
    line: THREE.InstancedMesh | InstanceLineSegments
    // brush:any
    // matrixArray:
}
const temp = new THREE.Line()

export class Drafter {
    tree!: TransformTree
    scene!: THREE.Scene
    instanceItems!: instanceItem[]
    group = new THREE.Group()
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
            color: 0xff00ff,
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1,
        }),
    }
    constructor(scene: THREE.Scene, initalGeo: THREE.BufferGeometry) {
        this.tree = new TransformTree()
        this.scene = scene
        // all material refrences, change color, lw , etc

        // instance refs
        this.instanceItems = []
        this.newInstance(initalGeo)
    }
    newInstance(geometry: THREE.BufferGeometry) {
        const id = this.instanceItems.length
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

        mesh.userData.id = id
        line.userData.id = id
        // this.instanceItems.push({ mesh, line })

        const x = 10
        const y = 10
        mesh.count = x * y
        // line.count = 1
        for (let i = 0; i < x; i++) {
            for (let j = 0; j < y; j++) {
                mesh.setMatrixAt(
                    i * x + j,
                    new THREE.Matrix4().makeTranslation(
                        new THREE.Vector3(i * 5, 0, j * 5)
                    )
                )
                line.setMatrixAt(
                    i * x + j,
                    new THREE.Matrix4().makeTranslation(
                        new THREE.Vector3(i * 5, 0, j * 5)
                    )
                )
            }
        }
        // mesh.visible = false

        this.scene.add(mesh)
        this.scene.add(line)
    }
    /*
    moveInstance() {}
    addInstance() {}
    removeInstance() {}
    pruneInstance() {}
    removeInstance() {}
    */
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
