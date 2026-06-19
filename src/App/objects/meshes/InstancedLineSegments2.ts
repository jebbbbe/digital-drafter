import {
    ClampToEdgeWrapping,
    DataTexture,
    FloatType,
    InstancedBufferAttribute,
    InstancedInterleavedBuffer,
    InterleavedBufferAttribute,
    Matrix4,
    NearestFilter,
    RGBAFormat,
} from "three"
import * as THREE from "three"
import { LineSegments2 } from "three/addons/lines/LineSegments2.js"
import type { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js"
import type { InstancedLineMaterial } from "../materials/InstancedLineMaterial"
import type { LineMaterial } from "../materials/LineMaterial"

const _identity = new Matrix4()

type InstancedInterleavedBufferAttribute = InterleavedBufferAttribute & {
    data: InstancedInterleavedBuffer
}

class InstancedLineSegments2 extends LineSegments2 {
    isInstancedLineSegments2: boolean
    _instanceCapacity: number
    _count: number
    declare geometry: LineSegmentsGeometry
    instanceMatrix!: InstancedBufferAttribute
    instanceMatrixTexture!: DataTexture

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

		// we will control this from outsidde the calss witha custom texture. 
		// we wont need syncMaterial, but we will need sync Geometry to update the buffers
		
        // this.instanceMatrix = new InstancedBufferAttribute(
        //     new Float32Array(this._instanceCapacity * 16),
        //     16
        // )

        // for (let i = 0; i < this._instanceCapacity; i++) {
        //     _identity.toArray(this.instanceMatrix.array, i * 16)
        // }

        // this.instanceMatrixTexture = this.createInstanceMatrixTexture(
        //     this.instanceMatrix
        // )

        this.count = count
        // this.syncMaterialState()
        this.syncGeometryState()
    }

    createInstanceMatrixTexture(
        instanceMatrix: InstancedBufferAttribute
    ): DataTexture {
        const texelCount = instanceMatrix.count * 4
        const maxSquareFactor = Math.floor(Math.sqrt(texelCount))
        let textureHeight = 1

        // Find the factor closest to square so the texture stays compact.
        for (let factor = maxSquareFactor; factor > 0; factor--) {
            if (texelCount % factor === 0) {
                textureHeight = factor
                break
            }
        }

        const width = texelCount / textureHeight
        const texture = new DataTexture(
            instanceMatrix.array,
            width,
            textureHeight,
            RGBAFormat,
            FloatType
        )

        texture.needsUpdate = true
        texture.magFilter = NearestFilter
        texture.minFilter = NearestFilter
        texture.wrapS = ClampToEdgeWrapping
        texture.wrapT = ClampToEdgeWrapping

        return texture
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

        // this.syncMaterialState()
        this.syncGeometryState()
    }

    getMatrixAt(index: number, matrix: THREE.Matrix4) {
        matrix.fromArray(this.instanceMatrix.array, index * 16)

        return matrix
    }

    setMatrixAt(index: number, matrix: THREE.Matrix4) {
        matrix.toArray(this.instanceMatrix.array, index * 16)
        this.markInstanceMatrixNeedsUpdate()

        return this
    }

    markInstanceMatrixNeedsUpdate() {
        this.instanceMatrix.needsUpdate = true
        this.instanceMatrixTexture.needsUpdate = true

        return this
    }

    syncMaterialState() {
        const material = this.material as unknown as InstancedLineMaterial

        if (material?.uniforms?.instanceMatrices !== undefined) {
            material.instanceMatrices = this.instanceMatrixTexture
        }

        if (material?.uniforms?.instanceMatrixCount !== undefined) {
            material.instanceMatrixCount = this.count
        }
    }

    syncGeometryState() {
        const geometry = this.geometry
        const instanceStart = geometry.getAttribute("instanceStart") as
            | InstancedInterleavedBufferAttribute
            | undefined
        const instanceEnd = geometry.getAttribute("instanceEnd") as
            | InstancedInterleavedBufferAttribute
            | undefined
        const instanceColorStart = geometry.getAttribute(
            "instanceColorStart"
        ) as InstancedInterleavedBufferAttribute | undefined
        const instanceColorEnd = geometry.getAttribute("instanceColorEnd") as
            | InstancedInterleavedBufferAttribute
            | undefined
        const instanceDistanceStart = geometry.getAttribute(
            "instanceDistanceStart"
        ) as InstancedInterleavedBufferAttribute | undefined
        const instanceDistanceEnd = geometry.getAttribute(
            "instanceDistanceEnd"
        ) as InstancedInterleavedBufferAttribute | undefined
        const segmentCount = instanceStart?.count ?? 0
        const meshPerAttribute = Math.max(1, this.count)

        geometry.instanceCount = segmentCount * this.count

        if (instanceStart !== undefined && instanceEnd !== undefined) {
            instanceStart.data.meshPerAttribute = meshPerAttribute

            geometry.setAttribute(
                "instanceStart",
                new InterleavedBufferAttribute(
                    instanceStart.data,
                    instanceStart.itemSize,
                    instanceStart.offset,
                    instanceStart.normalized
                )
            )
            geometry.setAttribute(
                "instanceEnd",
                new InterleavedBufferAttribute(
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
                new InterleavedBufferAttribute(
                    instanceColorStart.data,
                    instanceColorStart.itemSize,
                    instanceColorStart.offset,
                    instanceColorStart.normalized
                )
            )
            geometry.setAttribute(
                "instanceColorEnd",
                new InterleavedBufferAttribute(
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
                new InterleavedBufferAttribute(
                    instanceDistanceStart.data,
                    instanceDistanceStart.itemSize,
                    instanceDistanceStart.offset,
                    instanceDistanceStart.normalized
                )
            )
            geometry.setAttribute(
                "instanceDistanceEnd",
                new InterleavedBufferAttribute(
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
        // this.syncMaterialState()
        this.syncGeometryState()
        super.onBeforeRender(renderer)
    }
}

export { InstancedLineSegments2 }
