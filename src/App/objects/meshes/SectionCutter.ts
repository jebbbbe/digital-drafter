import * as THREE from "three"
import { Brush } from "three-bvh-csg"

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
    segmentNodeChildrenSlots = new Int32Array(this.array.length / this.stride).fill(-1)
    count = 0
    // for csg
    box = new THREE.BoxGeometry()
    brush = new Brush(this.box)
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
        this.brush.matrixAutoUpdate = false
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

        const nextSegmentNodeChildrenSlots = new Int32Array(
            nextSize / this.stride
        ).fill(-1)
        nextSegmentNodeChildrenSlots.set(this.segmentNodeChildrenSlots)
        this.segmentNodeChildrenSlots = nextSegmentNodeChildrenSlots

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

    getSegmentAsArray(index: number, array: number[] = [0, 0, 0, 0, 0, 0]) {
        const offset = index * this.itemSize
        array[0] = this.array[offset]
        array[1] = this.array[offset + 1]
        array[2] = this.array[offset + 2]
        array[3] = this.array[offset + 3]
        array[4] = this.array[offset + 4]
        array[5] = this.array[offset + 5]
        return array
    }
    getSegmentAsVector(
        index: number,
        a: THREE.Vector3 = new THREE.Vector3(),
        b: THREE.Vector3 = new THREE.Vector3()
    ) {
        const offset = index * this.itemSize
        a.fromArray(this.array, offset)
        b.fromArray(this.array, offset + this.itemSize)
        return [a, b]
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
        console.log("deleteFromNodeSlot")
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
        const movedNodeChildrenSlot =
            this.segmentNodeChildrenSlots[lastSegmentSlot]

        if (nodeSlot !== -1) {
            this.mapDelete(nodeSlot, index)
        }

        if (index !== lastIndex) {
            this.segmentNodeSlots[segmentSlot] = movedNodeSlot
            this.segmentNodeChildrenSlots[segmentSlot] = movedNodeChildrenSlot
            if (movedNodeSlot !== -1) {
                this.mapReplace(movedNodeSlot, lastIndex, index)
            }
        }

        this.segmentNodeSlots[lastSegmentSlot] = -1
        this.segmentNodeChildrenSlots[lastSegmentSlot] = -1
    }
}
