import * as THREE from "three"
import { Brush } from "three-bvh-csg"
import { LineSegments2 } from "three/addons/lines/LineSegments2.js"
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js"
import { matlib, orders } from "../draft/materialManager"
import type { Raycastable, SegmentAttachment, TransformNode } from "@types"

const material = matlib.sectionLine
export class SectionCutter {
    mesh: LineSegments2
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

    constructor(
        scene: THREE.Scene,
        raycastObjects: Raycastable,
        debug: boolean = false
    ) {
        const geometry = new LineSegmentsGeometry()
        geometry.setPositions(this.array)
        geometry.instanceCount = 0
        ;(geometry as any)._maxInstanceCount = this.array.length / this.stride
        this.mesh = new LineSegments2(geometry, material)

        scene.add(this.mesh)
        raycastObjects.push(this.mesh)

        this.mesh.position.y = 4
        this.mesh.frustumCulled = false
        this.mesh.renderOrder = orders.sectionLine
        this.brush.matrixAutoUpdate = false

        this.mesh.userData.attachments = this.attachments

        if (debug) this.setUpDebug(scene)
    }
    setUpDebug(scene: THREE.Scene) {
        const boxDebug = new THREE.Mesh(
            this.box,
            new THREE.MeshBasicMaterial({
                color: 0x00ffff,
            })
        )
        boxDebug.matrixAutoUpdate = false
        scene.add(boxDebug)
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

        const geometry = this.mesh.geometry
        geometry.setPositions(this.array)
        geometry.instanceCount = this.count / 2
        ;(geometry as any)._maxInstanceCount = this.array.length / this.stride

        this.markUpdate()
        return nextArray
    }

    markUpdate() {
        const geometry = this.mesh.geometry
        const instanceStart = geometry.getAttribute(
            "instanceStart"
        ) as THREE.InterleavedBufferAttribute
        const instanceEnd = geometry.getAttribute(
            "instanceEnd"
        ) as THREE.InterleavedBufferAttribute
        instanceStart.data.needsUpdate = true
        instanceEnd.data.needsUpdate = true
        geometry.instanceCount = this.count / 2
        ;(geometry as any)._maxInstanceCount = this.array.length / this.stride
        geometry.computeBoundingSphere()
        geometry.computeBoundingBox()
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

    moveSegmentVector(a: THREE.Vector3, b: THREE.Vector3, index: number) {
        // add pts to existing array
        const move = [0, 0, 0, 0, 0, 0]
        a.toArray(move, 0)
        b.toArray(move, this.itemSize)

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
        if (mark) this.markUpdate()
    }
}
