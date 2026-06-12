import * as THREE from "three"

const LINE_VERTEX_COUNT = 8
const LINE_INDEX = [0, 2, 1, 2, 3, 1, 2, 4, 3, 4, 5, 3, 4, 6, 5, 6, 7, 5]
const LINE_POSITIONS = [
    -1, 2, 0, 1, 2, 0, -1, 1, 0, 1, 1, 0, -1, 0, 0, 1, 0, 0, -1, -1, 0, 1,
    -1, 0,
]
const LINE_UVS = [-1, 2, 1, 2, -1, 1, 1, 1, -1, -1, 1, -1, -1, -2, 1, -2]
const _vector = new THREE.Vector3()

/**
 * Builds indexed wide-line topology from segment data and exposes a matching
 * `DataTexture` for `DataTextureLineMaterial` to read from.
 * Safe to use with `InstancedMesh`.
 */
export class DataTextureLineSegmentsGeometry extends THREE.BufferGeometry {
    typedArray!: THREE.TypedArray
    dataTexture!: THREE.DataTexture

    constructor(
        source?: THREE.TypedArray | THREE.EdgesGeometry | THREE.LineSegments
    ) {
        super()

        if (!source) {
            return
        }

        if (source instanceof THREE.LineSegments) {
            this.fromLineSegments(source)
            return
        }

        if (source instanceof THREE.EdgesGeometry) {
            this.fromEdgesGeometry(source)
            return
        }

        if (ArrayBuffer.isView(source)) {
            this.fromTypedArray(source as THREE.TypedArray)
        }
    }

    fromTypedArray(segmentPositions: THREE.TypedArray) {
        this.updateIndexBuffer(segmentPositions)
        return this
    }

    fromEdgesGeometry(geometry: THREE.EdgesGeometry) {
        const segmentPositions = geometry.getAttribute("position").array
        this.updateIndexBuffer(segmentPositions)
        return this
    }

    fromLineSegments(lineSegments: THREE.LineSegments) {
        const geometry = lineSegments.geometry
        const segmentPositions = geometry.getAttribute("position").array
        this.updateIndexBuffer(segmentPositions)
        return this
    }

    updateIndexBuffer(segmentPositions: THREE.TypedArray) {
        const segmentCount = segmentPositions.length / 6
        const indices = new Uint32Array(segmentCount * LINE_INDEX.length)
        const positions = new Float32Array(segmentCount * LINE_POSITIONS.length)
        const uvs = new Float32Array(segmentCount * LINE_UVS.length)

        for (let i = 0; i < segmentCount; i++) {
            const vertexOffset = i * LINE_VERTEX_COUNT
            const indexOffset = i * LINE_INDEX.length
            positions.set(LINE_POSITIONS, i * LINE_POSITIONS.length)
            uvs.set(LINE_UVS, i * LINE_UVS.length)

            for (let j = 0; j < LINE_INDEX.length; j++) {
                indices[indexOffset + j] = vertexOffset + LINE_INDEX[j]
            }
        }

        this.setIndex(new THREE.Uint32BufferAttribute(indices, 1))
        this.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
        this.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
        this.typedArray = segmentPositions
        this.createDataTexture(segmentPositions)
    }

    createDataTexture(segmentPositions: THREE.TypedArray = this.typedArray) {
        const segmentCount = segmentPositions.length / 6
        const segmentTexture = new THREE.DataTexture(
            segmentPositions,
            segmentCount * 2,
            1,
            THREE.RGBFormat,
            THREE.FloatType
        )
        segmentTexture.internalFormat = "RGB32F"
        segmentTexture.minFilter = THREE.NearestFilter
        segmentTexture.magFilter = THREE.NearestFilter
        segmentTexture.wrapS = THREE.ClampToEdgeWrapping
        segmentTexture.wrapT = THREE.ClampToEdgeWrapping
        segmentTexture.generateMipmaps = false
        segmentTexture.needsUpdate = true
        this.dataTexture = segmentTexture
        return segmentTexture
    }

    computeBoundingBox() {
        if (this.boundingBox === null) {
            this.boundingBox = new THREE.Box3()
        }

        this.boundingBox.makeEmpty()

        for (let i = 0; i < this.typedArray.length; i += 6) {
            _vector.fromArray(this.typedArray, i)
            this.boundingBox.expandByPoint(_vector)
            _vector.fromArray(this.typedArray, i + 3)
            this.boundingBox.expandByPoint(_vector)
        }
    }

    computeBoundingSphere() {
        if (this.boundingSphere === null) {
            this.boundingSphere = new THREE.Sphere()
        }

        if (this.boundingBox === null) {
            this.computeBoundingBox()
        }

        const center = this.boundingSphere.center
        this.boundingBox!.getCenter(center)

        let maxRadiusSq = 0

        for (let i = 0; i < this.typedArray.length; i += 6) {
            _vector.fromArray(this.typedArray, i)
            maxRadiusSq = Math.max(maxRadiusSq, center.distanceToSquared(_vector))
            _vector.fromArray(this.typedArray, i + 3)
            maxRadiusSq = Math.max(maxRadiusSq, center.distanceToSquared(_vector))
        }

        this.boundingSphere.radius = Math.sqrt(maxRadiusSq)

        if (isNaN(this.boundingSphere.radius)) {
            console.error(
                "THREE.DataTextureLineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The position data is likely to have NaN values.",
                this
            )
        }
    }
}
