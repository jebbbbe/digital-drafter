import * as THREE from "three"

type MapItem = {
    lines: number[]
}

export class SectionCutter {
    mesh!: THREE.LineSegments
    itemSize = 3
    stride = this.itemSize * 2 // 2 3d points
    // map nodes to its section Lines
    locationMap = new Map<number, MapItem>()
    // map lines to their nodeSlot
    array = new Float32Array(128 * this.stride)
    segmentNodeSlots = new Int32Array(this.array.length / this.stride).fill(-1)
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

    mapAdd(nodeSlot: number, segmentIndex: number) {
        const mapItem: MapItem | undefined = this.locationMap.get(nodeSlot)
        if (mapItem === undefined) {
            this.locationMap.set(nodeSlot, { lines: [segmentIndex] } as MapItem)
        } else {
            mapItem.lines.push(segmentIndex)
        }
    }

    mapDelete(nodeSlot: number, segmentIndex: number) {
        const mapItem: MapItem | undefined = this.locationMap.get(nodeSlot)
        if (mapItem !== undefined) {
            const idx = mapItem.lines.indexOf(segmentIndex)
            mapItem.lines.splice(idx, 1)
            if (mapItem.lines.length === 0) {
                this.locationMap.delete(nodeSlot)
            }
        }
    }

    mapReplace(
        nodeSlot: number,
        fromSegmentIndex: number,
        toSegmentIndex: number
    ) {
        const mapItem: MapItem | undefined = this.locationMap.get(nodeSlot)
        if (mapItem !== undefined) {
            const idx = mapItem.lines.indexOf(fromSegmentIndex)
            if (idx !== -1) {
                mapItem.lines[idx] = toSegmentIndex
            }
        }
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

        const nextSegmentNodeSlots = new Int32Array(
            nextSize / this.stride
        ).fill(-1)
        nextSegmentNodeSlots.set(this.segmentNodeSlots)
        this.segmentNodeSlots = nextSegmentNodeSlots

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
        geometry.computeBoundingSphere()
        geometry.computeBoundingBox()
    }

    addSegmentVector(
        a: THREE.Vector3,
        b: THREE.Vector3,
        nodeSlot?: number
    ): number {
        const index = this.count
        const offset = index * this.itemSize
        const segmentSlot = index / 2

        if (offset + this.stride > this.array.length) {
            this.resize(offset + this.stride)
        }

        a.toArray(this.array, offset)
        b.toArray(this.array, offset + this.itemSize)
        this.count += 2
        this.mesh.geometry.setDrawRange(0, this.count)
        this.markUpdate()

        // add to map
        this.segmentNodeSlots[segmentSlot] = nodeSlot ?? -1
        if (nodeSlot !== undefined) this.mapAdd(nodeSlot, index)

        return index
    }

    addSegmentArray(a: number[], nodeSlot?: number): number {
        const index = this.count
        const offset = index * this.itemSize
        const segmentSlot = index / 2
        if (offset + this.stride > this.array.length) {
            this.resize(offset + this.stride)
        }

        this.array.set(a, offset)

        this.count += 2
        this.mesh.geometry.setDrawRange(0, this.count)
        this.markUpdate()
        // add to map
        this.segmentNodeSlots[segmentSlot] = nodeSlot ?? -1
        if (nodeSlot !== undefined) this.mapAdd(nodeSlot, index)
        return index
    }

    patchSegmentVector(a: THREE.Vector3, b: THREE.Vector3, index: number) {
        const offset = index * this.itemSize
        a.toArray(this.array, offset)
        b.toArray(this.array, offset + this.itemSize)
        this.markUpdate()
    }

    patchSegmentArray(a: number[], index: number) {
        const offset = index * this.itemSize
        this.array.set(a, offset)
        this.markUpdate()
    }

    moveSegmentVector(a: THREE.Vector3, b: THREE.Vector3, index: number) {
        // add pts to existing array
        const move = [0, 0, 0, 0, 0, 0]
        a.toArray(move, 0)
        b.toArray(move, this.itemSize)

        this.moveSegmentArray(move, index)
    }

    moveSegmentArray(move: number[], index: number) {
        // add pts to existing array
        const offset = index * this.itemSize

        this.array[offset] += move[0]
        this.array[offset + 1] += move[1]
        this.array[offset + 2] += move[2]
        this.array[offset + 3] += move[3]
        this.array[offset + 4] += move[4]
        this.array[offset + 5] += move[5]

        this.markUpdate()
    }

    moveFromNodeSlot(a: THREE.Vector3, b: THREE.Vector3, nodeSlot: number) {
        const move = [0, 0, 0, 0, 0, 0]
        a.toArray(move, 0)
        b.toArray(move, this.itemSize)

        const mapItem = this.locationMap.get(nodeSlot)
        if (mapItem) {
            const lines = mapItem.lines
            for (let i = 0; i < lines.length; i++) {
                const index = lines[i]
                this.moveSegmentArray(move, index)
            }
        }
    }

    deleteFromNodeSlot(nodeSlot: number) {
        while (true) {
            const mapItem = this.locationMap.get(nodeSlot)
            if (!mapItem || mapItem.lines.length === 0) break
            this.deleteSegment(mapItem.lines[0], false)
        }
        this.markUpdate()
    }

    deleteSegment(index: number, mark: boolean = true) {
        if (index < 0 || index + 1 >= this.count) {
            return
        }

        const offset = index * this.itemSize
        const lastIndex = this.count - 2
        const lastOffset = lastIndex * this.itemSize
        const lastSegmentSlot = lastIndex / 2
        const segmentSlot = index / 2

        if (index !== lastIndex) {
            this.array.copyWithin(offset, lastOffset, lastOffset + this.stride)
        }

        this.array.fill(0, lastOffset, lastOffset + this.stride)
        this.count -= 2
        this.mesh.geometry.setDrawRange(0, this.count)
        if (mark) this.markUpdate()

        const nodeSlot = this.segmentNodeSlots[segmentSlot]
        const movedNodeSlot = this.segmentNodeSlots[lastSegmentSlot]

        if (nodeSlot !== -1) {
            this.mapDelete(nodeSlot, index)
        }

        if (index !== lastIndex) {
            this.segmentNodeSlots[segmentSlot] = movedNodeSlot
            if (movedNodeSlot !== -1) {
                this.mapReplace(movedNodeSlot, lastIndex, index)
            }
        }

        this.segmentNodeSlots[lastSegmentSlot] = -1
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
