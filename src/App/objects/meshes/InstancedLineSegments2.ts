import * as THREE from "three"
import { LineSegments2 } from "three/addons/lines/LineSegments2.js"
import type { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js"
import type { InstancedLineMaterial } from "../materials/InstancedLineMaterial"
import type { LineMaterial } from "three/addons/lines/LineMaterial.js"

type InstancedInterleavedBufferAttribute =
    | (THREE.InterleavedBufferAttribute & {
          data: THREE.InstancedInterleavedBuffer
      })
    | undefined

class InstancedLineSegments2 extends LineSegments2 {
    isInstancedLineSegments2: boolean
    _instanceCapacity: number
    _count: number
    declare geometry: LineSegmentsGeometry

    constructor(
        geometry: LineSegmentsGeometry,
        material: InstancedLineMaterial,
        count: number = 1
    ) {
        //@ts-ignore
        super(geometry, material as LineMaterial)
        ;(this as any).type = "InstancedLineSegments2"

        this.isInstancedLineSegments2 = true

        this._instanceCapacity = Math.max(1, count)
        this._count = 0

        this.count = count
        this.syncGeometryState()
    }

    // @ts-expect-error
    get count(): number {
        return this._count
    }

    set count(value: number) {
        this._count = Math.min(
            this._instanceCapacity,
            Math.max(0, Math.floor(value))
        )

        this.syncGeometryState()
    }

    syncGeometryState() {
        const geometry = this.geometry

        const instanceStart = geometry.getAttribute(
            "instanceStart"
        ) as InstancedInterleavedBufferAttribute

        const instanceEnd = geometry.getAttribute(
            "instanceEnd"
        ) as InstancedInterleavedBufferAttribute

        const instanceColorStart = geometry.getAttribute(
            "instanceColorStart"
        ) as InstancedInterleavedBufferAttribute

        const instanceColorEnd = geometry.getAttribute(
            "instanceColorEnd"
        ) as InstancedInterleavedBufferAttribute

        const instanceDistanceStart = geometry.getAttribute(
            "instanceDistanceStart"
        ) as InstancedInterleavedBufferAttribute

        const instanceDistanceEnd = geometry.getAttribute(
            "instanceDistanceEnd"
        ) as InstancedInterleavedBufferAttribute | undefined
        const segmentCount = instanceStart?.count ?? 0
        const meshPerAttribute = Math.max(1, this.count)

        //@ts-ignore clear internal prop
        delete geometry._maxInstanceCount
        geometry.instanceCount = segmentCount * this.count
        if (instanceStart !== undefined && instanceEnd !== undefined) {
            instanceStart.data.meshPerAttribute = meshPerAttribute

            geometry.setAttribute(
                "instanceStart",
                new THREE.InterleavedBufferAttribute(
                    instanceStart.data,
                    instanceStart.itemSize,
                    instanceStart.offset,
                    instanceStart.normalized
                )
            )
            geometry.setAttribute(
                "instanceEnd",
                new THREE.InterleavedBufferAttribute(
                    instanceEnd.data,
                    instanceEnd.itemSize,
                    instanceEnd.offset,
                    instanceEnd.normalized
                )
            )
        }

        if (
            instanceColorStart !== undefined &&
            instanceColorEnd !== undefined
        ) {
            instanceColorStart.data.meshPerAttribute = meshPerAttribute

            geometry.setAttribute(
                "instanceColorStart",
                new THREE.InterleavedBufferAttribute(
                    instanceColorStart.data,
                    instanceColorStart.itemSize,
                    instanceColorStart.offset,
                    instanceColorStart.normalized
                )
            )
            geometry.setAttribute(
                "instanceColorEnd",
                new THREE.InterleavedBufferAttribute(
                    instanceColorEnd.data,
                    instanceColorEnd.itemSize,
                    instanceColorEnd.offset,
                    instanceColorEnd.normalized
                )
            )
        }

        if (
            instanceDistanceStart !== undefined &&
            instanceDistanceEnd !== undefined
        ) {
            instanceDistanceStart.data.meshPerAttribute = meshPerAttribute

            geometry.setAttribute(
                "instanceDistanceStart",
                new THREE.InterleavedBufferAttribute(
                    instanceDistanceStart.data,
                    instanceDistanceStart.itemSize,
                    instanceDistanceStart.offset,
                    instanceDistanceStart.normalized
                )
            )
            geometry.setAttribute(
                "instanceDistanceEnd",
                new THREE.InterleavedBufferAttribute(
                    instanceDistanceEnd.data,
                    instanceDistanceEnd.itemSize,
                    instanceDistanceEnd.offset,
                    instanceDistanceEnd.normalized
                )
            )
        }
    }

    computeLineDistances() {
        super.computeLineDistances()
        this.syncGeometryState()

        return this
    }

    onBeforeRender(renderer: THREE.WebGLRenderer) {
        this.syncGeometryState()
        super.onBeforeRender(renderer)
    }
}

export { InstancedLineSegments2 }
