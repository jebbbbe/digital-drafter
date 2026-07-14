import * as THREE from "three"
import { Brush } from "three-bvh-csg"
import { LineMaterial } from "three/addons/lines/LineMaterial.js"
import { LineSegments2 } from "three/addons/lines/LineSegments2.js"
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js"
import { orders } from "../../draft/materialManager"
import type { SegmentAttachment, TransformNode } from "@types"

export class SectionCutter {
    mesh!: THREE.LineSegments | LineSegments2
    itemSize = 3
    stride = this.itemSize * 2 // 2 3d points
    array = new Float32Array(128 * this.stride)
    count = 0
    // to get Nodes
    nodeMap = new Map<number, TransformNode>()
    // for csg
    box = new THREE.BoxGeometry()
    brush = new Brush(this.box)
    attachments: (SegmentAttachment | undefined)[] = []

    constructor(material: THREE.Material) {
        if (material instanceof LineMaterial) {
            const geometry = new LineSegmentsGeometry()
            geometry.setPositions(this.array)
            geometry.instanceCount = 0
            ;(geometry as any)._maxInstanceCount =
                this.array.length / this.stride
            this.mesh = new LineSegments2(geometry, material)
        } else {
            const geometry = new THREE.BufferGeometry()
            geometry.setAttribute(
                "position",
                new THREE.BufferAttribute(this.array, this.itemSize)
            )
            geometry.setDrawRange(0, 0)
            this.mesh = new THREE.LineSegments(geometry, material)
        }
        this.mesh.position.y = 4
        this.mesh.frustumCulled = false
        this.mesh.renderOrder = orders.sectionLine
        this.brush.matrixAutoUpdate = false

        this.mesh.userData.attachments = this.attachments
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

        if (this.mesh instanceof LineSegments2) {
            const geometry = this.mesh.geometry
            geometry.setPositions(this.array)
            geometry.instanceCount = this.count / 2
            ;(geometry as any)._maxInstanceCount =
                this.array.length / this.stride
        } else {
            this.mesh.geometry.setAttribute(
                "position",
                new THREE.BufferAttribute(this.array, this.itemSize)
            )
        }

        this.markUpdate()
        return nextArray
    }

    markUpdate() {
        if (this.mesh instanceof LineSegments2) {
            const geometry = this.mesh.geometry
            const instanceStart = geometry.getAttribute(
                "instanceStart"
            ) as THREE.InterleavedBufferAttribute
            instanceStart.data.needsUpdate = true
            geometry.instanceCount = this.count / 2
            ;(geometry as any)._maxInstanceCount =
                this.array.length / this.stride
            geometry.computeBoundingSphere()
            geometry.computeBoundingBox()
            return
        }

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
        if (this.mesh instanceof THREE.LineSegments) {
            this.mesh.geometry.setDrawRange(0, this.count)
        }
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
        if (this.mesh instanceof THREE.LineSegments) {
            this.mesh.geometry.setDrawRange(0, this.count)
        }
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
        const movedAttachment = this.attachments[lastIndex]
        if (index !== lastIndex) {
            this.array.copyWithin(offset, lastOffset, lastOffset + this.stride)
            if (movedNode !== undefined) {
                this.nodeMap.set(index, movedNode)
                const attachment = movedNode.attachments.segment
                if (attachment !== undefined) {
                    attachment.index = index
                }
            } else {
                this.nodeMap.delete(index)
            }

            this.attachments[index] = movedAttachment
            if (movedAttachment !== undefined) {
                movedAttachment.index = index
            }
            this.attachments[lastIndex] = undefined
        } else {
            this.attachments[lastIndex] = undefined
        }
        this.array.fill(0, lastOffset, lastOffset + this.stride)
        this.nodeMap.delete(lastIndex)
        this.count -= 2
        if (this.mesh instanceof THREE.LineSegments) {
            this.mesh.geometry.setDrawRange(0, this.count)
        }
        if (mark) this.markUpdate()
    }
}
