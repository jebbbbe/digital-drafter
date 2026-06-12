import {
    Box3,
    ClampToEdgeWrapping,
    DataTexture,
    FloatType,
    Float32BufferAttribute,
    InstancedBufferAttribute,
    InstancedBufferGeometry,
    InstancedInterleavedBuffer,
    InterleavedBufferAttribute,
    Matrix4,
    NearestFilter,
    RGBAFormat,
    Sphere,
    Vector3,
    WireframeGeometry,
    type BufferAttribute,
} from "three"

const _box = new Box3()
const _identity = new Matrix4()
const _vector = new Vector3()

class MatrixTextureLineSegmentsGeometry extends InstancedBufferGeometry {
    instanceMatrix: InstancedBufferAttribute
    instanceMatrixTexture: DataTexture
    matrixCapacity: number
    matrixCount: number

    private positionArray: Float32Array<ArrayBufferLike> | null = null
    private colorArray: Float32Array<ArrayBufferLike> | null = null
    private distanceArray: Float32Array<ArrayBufferLike> | null = null

    constructor(matrixCapacity = 1, matrixCount = matrixCapacity) {
        super()

        //@ts-ignore
        this.isLineSegmentsGeometry = true
        //@ts-ignore
        this.isMatrixTextureLineSegmentsGeometry = true

        ;(this as any).type = "MatrixTextureLineSegmentsGeometry"

        const positions = [
            -1, 2, 0, 1, 2, 0, -1, 1, 0, 1, 1, 0, -1, 0, 0, 1, 0, 0, -1, -1, 0,
            1, -1, 0,
        ]
        const uvs = [-1, 2, 1, 2, -1, 1, 1, 1, -1, -1, 1, -1, -1, -2, 1, -2]
        const index = [0, 2, 1, 2, 3, 1, 2, 4, 3, 4, 5, 3, 4, 6, 5, 6, 7, 5]

        this.setIndex(index)
        this.setAttribute("position", new Float32BufferAttribute(positions, 3))
        this.setAttribute("uv", new Float32BufferAttribute(uvs, 2))

        this.matrixCapacity = 1
        this.matrixCount = 1
        this.instanceMatrix = new InstancedBufferAttribute(new Float32Array(16), 16)
        this.instanceMatrixTexture = this.createInstanceMatrixTexture(
            this.instanceMatrix
        )

        this.setMatrixCapacity(matrixCapacity)
        this.setMatrixCount(matrixCount)
    }

    private createInstanceMatrixTexture(
        instanceMatrix: InstancedBufferAttribute
    ): DataTexture {
        const texture = new DataTexture(
            instanceMatrix.array,
            4,
            instanceMatrix.count,
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

    private reapplySegmentBuffers() {
        if (this.positionArray !== null) {
            this.setPositions(this.positionArray)
        }

        if (this.colorArray !== null) {
            this.setColors(this.colorArray)
        }

        if (this.distanceArray !== null) {
            this.setLineDistances(this.distanceArray)
        }
    }

    applyMatrix4(matrix: Matrix4) {
        const start = this.attributes.instanceStart as BufferAttribute | undefined
        const end = this.attributes.instanceEnd as BufferAttribute | undefined

        if (start !== undefined && end !== undefined) {
            start.applyMatrix4(matrix)
            end.applyMatrix4(matrix)
            start.needsUpdate = true
            end.needsUpdate = true
        }

        if (this.boundingBox !== null) {
            this.computeBoundingBox()
        }

        if (this.boundingSphere !== null) {
            this.computeBoundingSphere()
        }

        return this
    }

    setMatrixCapacity(count: number) {
        const nextCapacity = Math.max(1, Math.floor(count))
        const nextArray = new Float32Array(nextCapacity * 16)
        const copyCount = Math.min(this.instanceMatrix.count, nextCapacity)

        nextArray.set(this.instanceMatrix.array.subarray(0, copyCount * 16))

        for (let i = copyCount; i < nextCapacity; i++) {
            _identity.toArray(nextArray, i * 16)
        }

        this.matrixCapacity = nextCapacity
        this.instanceMatrix = new InstancedBufferAttribute(nextArray, 16)

        this.instanceMatrixTexture.dispose()
        this.instanceMatrixTexture = this.createInstanceMatrixTexture(
            this.instanceMatrix
        )

        this.matrixCount = Math.min(this.matrixCount, this.matrixCapacity)
        this.reapplySegmentBuffers()

        return this
    }

    setMatrixCount(count: number) {
        this.matrixCount = Math.min(
            this.matrixCapacity,
            Math.max(1, Math.floor(count))
        )

        this.reapplySegmentBuffers()

        return this
    }

    getMatrixAt(index: number, matrix: Matrix4) {
        matrix.fromArray(this.instanceMatrix.array, index * 16)

        return matrix
    }

    setMatrixAt(index: number, matrix: Matrix4) {
        matrix.toArray(this.instanceMatrix.array, index * 16)
        this.instanceMatrix.needsUpdate = true
        this.instanceMatrixTexture.needsUpdate = true

        return this
    }

    markMatrixTextureNeedsUpdate() {
        this.instanceMatrix.needsUpdate = true
        this.instanceMatrixTexture.needsUpdate = true

        return this
    }

    setPositions(array: Float32Array<ArrayBufferLike> | Array<number>) {
        const lineSegments =
            array instanceof Float32Array ? array : new Float32Array(array)

        this.positionArray = lineSegments

        const instanceBuffer = new InstancedInterleavedBuffer(
            lineSegments,
            6,
            this.matrixCount
        )

        this.setAttribute(
            "instanceStart",
            new InterleavedBufferAttribute(instanceBuffer, 3, 0)
        )
        this.setAttribute(
            "instanceEnd",
            new InterleavedBufferAttribute(instanceBuffer, 3, 3)
        )

        this.instanceCount = this.attributes.instanceStart.count * this.matrixCount

        this.computeBoundingBox()
        this.computeBoundingSphere()

        return this
    }

    setColors(array: Float32Array<ArrayBufferLike> | Array<number>) {
        const colors = array instanceof Float32Array ? array : new Float32Array(array)

        this.colorArray = colors

        const instanceColorBuffer = new InstancedInterleavedBuffer(
            colors,
            6,
            this.matrixCount
        )

        this.setAttribute(
            "instanceColorStart",
            new InterleavedBufferAttribute(instanceColorBuffer, 3, 0)
        )
        this.setAttribute(
            "instanceColorEnd",
            new InterleavedBufferAttribute(instanceColorBuffer, 3, 3)
        )

        return this
    }

    setLineDistances(array: Float32Array<ArrayBufferLike> | Array<number>) {
        const lineDistances =
            array instanceof Float32Array ? array : new Float32Array(array)

        this.distanceArray = lineDistances

        const instanceDistanceBuffer = new InstancedInterleavedBuffer(
            lineDistances,
            2,
            this.matrixCount
        )

        this.setAttribute(
            "instanceDistanceStart",
            new InterleavedBufferAttribute(instanceDistanceBuffer, 1, 0)
        )
        this.setAttribute(
            "instanceDistanceEnd",
            new InterleavedBufferAttribute(instanceDistanceBuffer, 1, 1)
        )

        return this
    }

    computeLineDistances() {
        const instanceStart = this.attributes.instanceStart as
            | BufferAttribute
            | undefined
        const instanceEnd = this.attributes.instanceEnd as BufferAttribute | undefined

        if (instanceStart === undefined || instanceEnd === undefined) {
            return this
        }

        const lineDistances = new Float32Array(2 * instanceStart.count)

        for (let i = 0, j = 0, l = instanceStart.count; i < l; i++, j += 2) {
            _vector.fromBufferAttribute(instanceStart, i)
            const start = _vector.clone()
            _vector.fromBufferAttribute(instanceEnd, i)

            lineDistances[j] = j === 0 ? 0 : lineDistances[j - 1]
            lineDistances[j + 1] = lineDistances[j] + start.distanceTo(_vector)
        }

        return this.setLineDistances(lineDistances)
    }

    //@ts-ignore
    fromWireframeGeometry(geometry) {
        this.setPositions(geometry.attributes.position.array)

        return this
    }

    //@ts-ignore
    fromEdgesGeometry(geometry) {
        this.setPositions(geometry.attributes.position.array)

        return this
    }

    //@ts-ignore
    fromMesh(mesh) {
        this.fromWireframeGeometry(new WireframeGeometry(mesh.geometry))

        return this
    }

    //@ts-ignore
    fromLineSegments(lineSegments) {
        const geometry = lineSegments.geometry
        this.setPositions(geometry.attributes.position.array)

        return this
    }

    computeBoundingBox() {
        if (this.boundingBox === null) {
            this.boundingBox = new Box3()
        }

        const start = this.attributes.instanceStart as BufferAttribute | undefined
        const end = this.attributes.instanceEnd as BufferAttribute | undefined

        if (start !== undefined && end !== undefined) {
            this.boundingBox.setFromBufferAttribute(start)
            _box.setFromBufferAttribute(end)
            this.boundingBox.union(_box)
        }
    }

    computeBoundingSphere() {
        if (this.boundingSphere === null) {
            this.boundingSphere = new Sphere()
        }

        if (this.boundingBox === null) {
            this.computeBoundingBox()
        }

        const start = this.attributes.instanceStart as BufferAttribute | undefined
        const end = this.attributes.instanceEnd as BufferAttribute | undefined

        if (start !== undefined && end !== undefined) {
            const center = this.boundingSphere.center
            this.boundingBox!.getCenter(center)

            let maxRadiusSq = 0

            for (let i = 0, il = start.count; i < il; i++) {
                _vector.fromBufferAttribute(start, i)
                maxRadiusSq = Math.max(
                    maxRadiusSq,
                    center.distanceToSquared(_vector)
                )

                _vector.fromBufferAttribute(end, i)
                maxRadiusSq = Math.max(
                    maxRadiusSq,
                    center.distanceToSquared(_vector)
                )
            }

            this.boundingSphere.radius = Math.sqrt(maxRadiusSq)

            if (isNaN(this.boundingSphere.radius)) {
                console.error(
                    "THREE.MatrixTextureLineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",
                    this
                )
            }
        }
    }
}

export { MatrixTextureLineSegmentsGeometry }
