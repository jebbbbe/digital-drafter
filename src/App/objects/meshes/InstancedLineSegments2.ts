import {
    ClampToEdgeWrapping,
    DataTexture,
    FloatType,
    InstancedBufferAttribute,
    InstancedInterleavedBuffer,
    InterleavedBufferAttribute,
    Matrix4,
    NearestFilter,
    RGBFormat,
    RGBAFormat,
    type PixelFormat,
    type TypedArray,
} from "three"
import * as THREE from "three"
import { LineSegments2 } from "three/addons/lines/LineSegments2.js"
import type { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js"
import type { LineMaterial } from "three/addons/lines/LineMaterial.js"
import type { InstancedLineMaterial } from "../materials"

const _identity = new Matrix4()

function createDataTexture(
    array: TypedArray,
    texelCount: number,
    format: PixelFormat = RGBAFormat
): DataTexture {
    let textureHeight = 1
    const maxSquareFactor = Math.floor(Math.sqrt(texelCount))

    // Find the factor closest to square so the texture stays compact.
    for (let factor = maxSquareFactor; factor > 0; factor--) {
        if (texelCount % factor === 0) {
            textureHeight = factor
            break
        }
    }

    const width = texelCount / textureHeight
    const texture = new DataTexture(
        array,
        width,
        textureHeight,
        format,
        FloatType
    )

    return texture
}
type InstancedInterleavedBufferAttribute = InterleavedBufferAttribute & {
    data: InstancedInterleavedBuffer
}

class InstancedLineSegments2 extends LineSegments2 {
    isInstancedLineSegments2: boolean
    _instanceCapacity: number
    _count: number
    declare geometry: LineSegmentsGeometry
    instanceMatrix: InstancedBufferAttribute
    instanceMatrixTexture: DataTexture
    instanceColor: InstancedBufferAttribute | null
    instanceColorTexture: DataTexture | null

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

        this.instanceMatrix = new InstancedBufferAttribute(
            new Float32Array(this._instanceCapacity * 16),
            16
        )

        for (let i = 0; i < this._instanceCapacity; i++) {
            _identity.toArray(this.instanceMatrix.array, i * 16)
        }

        this.instanceMatrixTexture = this.createInstanceMatrixTexture()
        this.instanceColor = null
        this.instanceColorTexture = null

        this.count = count
        this.syncMaterialState()
        this.syncGeometryState()
    }

    createInstanceMatrixTexture(
        instanceMatrix: InstancedBufferAttribute = this.instanceMatrix
    ): DataTexture {
        const texture = createDataTexture(
            instanceMatrix.array,
            instanceMatrix.count * 4
        )
        texture.needsUpdate = true
        texture.magFilter = NearestFilter
        texture.minFilter = NearestFilter
        texture.wrapS = ClampToEdgeWrapping
        texture.wrapT = ClampToEdgeWrapping
        this.instanceMatrixTexture?.dispose()
        this.instanceMatrixTexture = texture
        return texture
    }

    createInstanceColorTexture() {
        if (this.instanceColor === null) {
            this.instanceColor = new InstancedBufferAttribute(
                new Float32Array(this.instanceMatrix.count * 3).fill(1),
                3
            )
        }

        const texture = createDataTexture(
            this.instanceColor.array,
            this.instanceColor.count,
            RGBFormat
        )

        // Three infers RGBA32F automatically, but RGB float textures need an
        // explicit sized internal format to upload predictably in WebGL2.
        texture.internalFormat = "RGB32F"
        texture.needsUpdate = true
        texture.magFilter = NearestFilter
        texture.minFilter = NearestFilter
        texture.wrapS = ClampToEdgeWrapping
        texture.wrapT = ClampToEdgeWrapping
        this.instanceColorTexture?.dispose()
        this.instanceColorTexture = texture
        this.syncMaterialState()
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

        this.syncMaterialState()
        this.syncGeometryState()
    }

    getMatrixAt(index: number, matrix: THREE.Matrix4) {
        matrix.fromArray(this.instanceMatrix.array, index * 16)

        return matrix
    }

    getColorAt(index: number, color: THREE.Color) {
        if (this.instanceColor === null) {
            throw new Error(
                "InstancedLineSegments2 has no instanceColor attribute"
            )
        }

        color.fromArray(this.instanceColor.array, index * 3)

        return color
    }

    setMatrixAt(index: number, matrix: THREE.Matrix4) {
        matrix.toArray(this.instanceMatrix.array, index * 16)
        this.markInstanceMatrixNeedsUpdate()

        return this
    }

    setColorAt(index: number, color: THREE.Color) {
        if (this.instanceColor === null) {
            this.createInstanceColorTexture()
        }

        color.toArray(this.instanceColor!.array, index * 3)
        this.markInstanceColorNeedsUpdate()

        return this
    }

    markInstanceMatrixNeedsUpdate() {
        this.instanceMatrix.needsUpdate = true
        this.instanceMatrixTexture.needsUpdate = true

        return this
    }

    markInstanceColorNeedsUpdate() {
        if (this.instanceColor === null || this.instanceColorTexture === null) {
            return this
        }

        this.instanceColor.needsUpdate = true
        this.instanceColorTexture.needsUpdate = true

        return this
    }

    syncMaterialState() {
        const material = this.material as unknown as InstancedLineMaterial

        if (material?.uniforms?.instanceMatrices !== undefined) {
            material.instanceMatrices = this.instanceMatrixTexture
        }

        if (material?.uniforms?.instanceColors !== undefined) {
            material.instanceColors = this.instanceColorTexture ?? null
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
}

export { InstancedLineSegments2 }
