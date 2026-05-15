import * as THREE from "three"

type mapItem = {
    lines: number[]
    prevPosition: THREE.Vector3
}

export class SectionCutter {
    mesh!: THREE.LineSegments
    itemSize = 3
    stride = this.itemSize * 2 // 2 3d points
    locationMap = new Map<number, number[]>()
    array = new Float32Array(128 * this.stride)
    count = 0
    constructor(material: THREE.Material) {
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(this.array, this.itemSize)
        )
        geometry.setDrawRange(0, 0)
        this.mesh = new THREE.LineSegments(geometry, material)
        this.mesh.position.y = 4
        this.mesh.frustumCulled = false
    }

    resize(minSize = this.array.length * 2) {
        // increase buffer size
        let nextSize = this.array.length

        while (nextSize < minSize) {
            nextSize *= 2
        }

        const nextArray = new Float32Array(nextSize)
        nextArray.set(this.array)
        this.array = nextArray
        this.mesh.geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(this.array, this.itemSize)
        )
        this.markUpdate()
        return nextArray
    }

    markUpdate() {
        const geometry = this.mesh.geometry
        const position = this.mesh.geometry.getAttribute(
            "position"
        ) as THREE.BufferAttribute
        position.needsUpdate = true
        geometry.computeBoundingSphere();
        geometry.computeBoundingBox();

    }

    addSegmentVector(a: THREE.Vector3, b: THREE.Vector3): number {
        const index = this.count
        const offset = index * this.itemSize

        if (offset + this.stride > this.array.length) {
            this.resize(offset + this.stride)
        }

        a.toArray(this.array, offset)
        b.toArray(this.array, offset + this.itemSize)
        this.count += 2
        this.mesh.geometry.setDrawRange(0, this.count)
        this.markUpdate()
        return index
    }

    addSegmentArray(a: number[]): number {
        const index = this.count
        const offset = index * this.itemSize
        if (offset + this.stride > this.array.length) {
            this.resize(offset + this.stride)
        }

        this.array.set(a, offset)

        this.count += 2
        this.mesh.geometry.setDrawRange(0, this.count)
        this.markUpdate()
        return index
    }

    patchSegmentVector(a: THREE.Vector3, b: THREE.Vector3, index: number) {
        const offset = index * this.itemSize
        a.toArray(this.array, offset)
        b.toArray(this.array, offset + this.itemSize)
        this.markUpdate()
    }

    patchsegmentArray(a: number[], index: number) {
        const offset = index * this.itemSize
        this.array.set(a, offset)
        this.markUpdate()
    }

    deleteSegment(index: number) {
        if (index < 0 || index + 1 >= this.count) {
            return
        }

        const offset = index * this.itemSize
        const lastIndex = this.count - 2
        const lastOffset = lastIndex * this.itemSize

        if (index !== lastIndex) {
            this.array.copyWithin(offset, lastOffset, lastOffset + this.stride)
        }

        this.array.fill(0, lastOffset, lastOffset + this.stride)
        this.count -= 2
        this.mesh.geometry.setDrawRange(0, this.count)
        this.markUpdate()
    }
}

export class AddSegmentsMesh extends THREE.LineSegments {
    constructor(material: THREE.Material) {
        const geometry = new THREE.BufferGeometry()
        super(geometry, material)
        geometry.setDrawRange(0, 0)

        const itemSize = 3
        const stride = itemSize * 2 // 2 3d points
        this.userData.locationMap = new Map<number, number[]>()
        this.userData.itemSize = itemSize
        this.userData.stride = stride
        this.userData.array = new Float32Array(128 * stride)
        this.userData.count = 0

        geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(this.userData.array, itemSize)
        )
    }

    markUpdate() {
        const position = this.geometry.getAttribute(
            "position"
        ) as THREE.BufferAttribute
        position.needsUpdate = true
    }

    // add line
    addSegment(a: THREE.Vector3, b: THREE.Vector3): number {
        let { count, array, itemSize } = this.userData
        const index = count
        const offset = index * itemSize

        if (offset + this.userData.stride > array.length) {
            array = this.resize(offset + this.userData.stride)
        }

        a.toArray(array, offset)
        b.toArray(array, offset + itemSize)
        count += 2
        this.geometry.setDrawRange(0, count)
        this.markUpdate()
        this.userData.count = count
        return index
    }

    // update line from index
    patchSegment(a: THREE.Vector3, b: THREE.Vector3, index: number) {
        const { array, itemSize } = this.userData
        const offset = index * itemSize
        a.toArray(array, offset)
        b.toArray(array, offset + itemSize)
        this.markUpdate()
    }

    // delete line
    deleteSegment(index: number) {
        let { count, array, itemSize, stride } = this.userData

        if (index < 0 || index + 1 >= count) {
            return
        }

        const offset = index * itemSize
        const lastIndex = count - 2
        const lastOffset = lastIndex * itemSize

        if (index !== lastIndex) {
            array.copyWithin(offset, lastOffset, lastOffset + stride)
        }

        array.fill(0, lastOffset, lastOffset + stride)
        count -= 2
        this.geometry.setDrawRange(0, count)
        this.markUpdate()
        this.userData.count = count
    }

    addSegmentFromID(a: THREE.Vector3, b: THREE.Vector3) {
        return this.addSegment(a, b) / 2
    }

    patchSegmentFromID(a: THREE.Vector3, b: THREE.Vector3, id: number) {
        this.patchSegment(a, b, id * 2)
    }

    deleteSegmentFromID(id: number) {
        this.deleteSegment(id * 2)
    }

    // resize line
    resize(minSize = this.userData.array.length * 2) {
        let { array } = this.userData

        // increase buffer size
        let nextSize = array.length

        while (nextSize < minSize) {
            nextSize *= 2
        }

        const nextArray = new Float32Array(nextSize)
        nextArray.set(this.userData.array)
        this.userData.array = nextArray
        this.geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(
                this.userData.array,
                this.userData.itemSize
            )
        )
        this.markUpdate()
        return nextArray
    }
}

// interacction
// raycast -> index -> node lookup. -> compund matrix
/*

..[] to point
_prev matrix * point 
point *= new matrix
point -> write




interaction: 
sel node -> cut btn-> enter cut mode. 

SIMPLE:
draw line segment -> 
-> preview section ->
-> accept/reject. 
-> add preview as instance.

ADVANCED
edit cuts-> 
raycast on node only. 
click node , select side. 
click off, add cut segment.
enfore line segmetn legnth.
multiple segments, detemine which union of shaoe to keep/ add.
line network search. 


move nodes->
need to update cut lines...

SIMPLE:
loop over all lines and inverse then multiply

ADVANCED:
datastructure to update only effected secitons.

options,
buffer is local pts, transform with nodeMatrix.
needs nodeslot buffer,
must be instanced, must have InstanceMatrix for raycast.
becomes per INstance.

pos is result of matrix tranform.
on change,


buffer to vec3..
prevInv.copy(prevM).invert()
point.applyMatrix4(prevInv)
point.applyMatrix4(newM)
vec3 to buffer...

i guess we just have a lookup of matrix inverses, 

const prevInv = invs[index]
point.applyMatrix4(prevInv)
point.applyMatrix4(newM)
invs[index].clone(newM).inverse()

and when we update the local position we do: 

delta // vec3 
const prevInv = invs[index]
point.applyMatrix4(prevInv)
point.add(delta)
point.applyMatrix4(prevInv.clone.inverse())


for node changes, we always get a subtree array of nodes. 
in the loop we:

map location to array of section lines for a node.
calc update on each line group. 
update inv matrix.

* line segments can share a matrix.
* how to store lookup for both...
* 
* 
* matrix has rotation info... we only need position offsets. 
* so store positions only! 

two maps: 
array of 
index -> point class instance. | NOTE same isntance as NODE, must be unique to do reverse
map of 
nodeLocation -> array of indexes.

mapItem = {
    lines:[],
    prevPosition:Vec3
}
const nodesMap = new Map<number,mapItem>()

for just three.pts, no need for a lookup! can just add the delta!
move(delta, index){
    p1 + delta
    p2 + delta
}
moveEndPoint(delx, index, first:bool){
    pn + delta
}
add(p1,p2, nodeLocation){
 // update buffer AND add to node location
}
 delete(index){
 // get map, remove from mapItem.lines OR delete the item.

 }

// update from NODE
node[]
for(){
const loc = num(node.location)
const mapItem = nodesMap.get(loc)
const prevPosition = mapItem.prevPosition
const 
}




*/
