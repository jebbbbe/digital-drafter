import * as THREE from "three"
import { Brush } from "three-bvh-csg"
import type { TransformNode } from "../../draft/TransformNode"

type MapItem = {
    lines: number[]
}

/*
type MapItem = {
    lines: number[] // array of indexs
    segmentSelect: number[] // array of indexs
    sectionGroup: THREE.GROUP
}
map.get(slotIndex) -> mapItem




*/

export class SectionCutter {
    mesh!: THREE.LineSegments
    itemSize = 3
    stride = this.itemSize * 2 // 2 3d points
    array = new Float32Array(128 * this.stride)
    count = 0
    // to get Nodes
    nodeMap = new Map<number, TransformNode>()

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
        node: TransformNode
    ): number {
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

        this.nodeMap.set(index, node)
        return index
    }

    addSegmentArray(a: number[], node: TransformNode): number {
        const index = this.count
        const offset = index * this.itemSize
        if (offset + this.stride > this.array.length) {
            this.resize(offset + this.stride)
        }

        this.array.set(a, offset)

        this.count += 2
        this.mesh.geometry.setDrawRange(0, this.count)
        this.markUpdate()

        this.nodeMap.set(index, node)
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

    deleteSegment(index: number, mark: boolean = true) {
        if (index < 0 || index + 1 >= this.count) {
            return
        }
        const offset = index * this.itemSize
        const lastIndex = this.count - 2
        const lastOffset = lastIndex * this.itemSize
        const movedNode = this.nodeMap.get(lastIndex)
        if (index !== lastIndex) {
            this.array.copyWithin(offset, lastOffset, lastOffset + this.stride)
            if (movedNode !== undefined) {
                this.nodeMap.set(index, movedNode)
            } else {
                this.nodeMap.delete(index)
            }
        }
        this.array.fill(0, lastOffset, lastOffset + this.stride)
        this.nodeMap.delete(lastIndex)
        this.count -= 2
        this.mesh.geometry.setDrawRange(0, this.count)
        if (mark) this.markUpdate()
    }
}
