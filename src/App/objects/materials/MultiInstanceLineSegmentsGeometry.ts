import {
    Box3,
    BufferGeometry,
    Sphere,
    Uint32BufferAttribute,
    Vector3,
    WireframeGeometry,
    type EdgesGeometry,
    type LineSegments,
    type Matrix4,
    type Mesh,
} from "three"

const _box = new Box3()
const _vector = new Vector3()
const _start = new Vector3()
const _end = new Vector3()

const LINE_VERTEX_COUNT = 8
const LINE_INDEX = [0, 2, 1, 2, 3, 1, 2, 4, 3, 4, 5, 3, 4, 6, 5, 6, 7, 5]

export class MultiInstanceLineSegmentsGeometry extends BufferGeometry {
    segmentPoints: Float32Array<ArrayBufferLike> = new Float32Array()
    segmentColors: Float32Array<ArrayBufferLike> | null = null
    segmentDistances: Float32Array<ArrayBufferLike> | null = null
    segmentCount = 0

    constructor() {
        super()

        //@ts-ignore
        this.isLineSegmentsGeometry = true
        //@ts-ignore
        this.isMultiInstanceLineSegmentsGeometry = true

        ;(this as any).type = "MultiInstanceLineSegmentsGeometry"
    }

    private rebuildDrawGeometry() {
        const indices = new Uint32Array(this.segmentCount * LINE_INDEX.length)

        for (let i = 0; i < this.segmentCount; i++) {
            const vertexBase = i * LINE_VERTEX_COUNT
            const indexOffset = i * LINE_INDEX.length

            for (let j = 0; j < LINE_INDEX.length; j++) {
                indices[indexOffset + j] = vertexBase + LINE_INDEX[j]
            }
        }

        this.setIndex(new Uint32BufferAttribute(indices, 1))
        this.deleteAttribute("position")
        this.deleteAttribute("uv")
    }

    applyMatrix4(matrix: Matrix4) {
        for (let i = 0; i < this.segmentPoints.length; i += 6) {
            _start.fromArray(this.segmentPoints, i).applyMatrix4(matrix)
            _end.fromArray(this.segmentPoints, i + 3).applyMatrix4(matrix)

            _start.toArray(this.segmentPoints, i)
            _end.toArray(this.segmentPoints, i + 3)
        }

        if (this.boundingBox !== null) {
            this.computeBoundingBox()
        }

        if (this.boundingSphere !== null) {
            this.computeBoundingSphere()
        }

        return this
    }

    setPositions(array: Float32Array<ArrayBufferLike> | Array<number>) {
        this.segmentPoints =
            array instanceof Float32Array ? array : new Float32Array(array)
        this.segmentCount = this.segmentPoints.length / 6

        this.rebuildDrawGeometry()
        this.computeBoundingBox()
        this.computeBoundingSphere()

        return this
    }

    setColors(array: Float32Array<ArrayBufferLike> | Array<number>) {
        this.segmentColors =
            array instanceof Float32Array ? array : new Float32Array(array)

        return this
    }

    setLineDistances(array: Float32Array<ArrayBufferLike> | Array<number>) {
        this.segmentDistances =
            array instanceof Float32Array ? array : new Float32Array(array)

        return this
    }

    computeLineDistances() {
        const lineDistances = new Float32Array(this.segmentCount * 2)

        for (let i = 0, j = 0; i < this.segmentPoints.length; i += 6, j += 2) {
            _start.fromArray(this.segmentPoints, i)
            _end.fromArray(this.segmentPoints, i + 3)

            lineDistances[j] = j === 0 ? 0 : lineDistances[j - 1]
            lineDistances[j + 1] = lineDistances[j] + _start.distanceTo(_end)
        }

        return this.setLineDistances(lineDistances)
    }

    fromWireframeGeometry(geometry: WireframeGeometry) {
        this.setPositions(geometry.attributes.position.array as Float32Array)

        return this
    }

    fromEdgesGeometry(geometry: EdgesGeometry) {
        this.setPositions(geometry.attributes.position.array as Float32Array)

        return this
    }

    fromMesh(mesh: Mesh) {
        this.fromWireframeGeometry(new WireframeGeometry(mesh.geometry))

        return this
    }

    fromLineSegments(lineSegments: LineSegments) {
        const geometry = lineSegments.geometry
        this.setPositions(geometry.attributes.position.array as Float32Array)

        return this
    }

    computeBoundingBox() {
        if (this.boundingBox === null) {
            this.boundingBox = new Box3()
        }

        this.boundingBox.makeEmpty()

        for (let i = 0; i < this.segmentPoints.length; i += 6) {
            _start.fromArray(this.segmentPoints, i)
            _end.fromArray(this.segmentPoints, i + 3)
            this.boundingBox.expandByPoint(_start)
            this.boundingBox.expandByPoint(_end)
        }
    }

    computeBoundingSphere() {
        if (this.boundingSphere === null) {
            this.boundingSphere = new Sphere()
        }

        if (this.boundingBox === null) {
            this.computeBoundingBox()
        }

        const center = this.boundingSphere.center
        this.boundingBox!.getCenter(center)

        let maxRadiusSq = 0

        for (let i = 0; i < this.segmentPoints.length; i += 6) {
            _start.fromArray(this.segmentPoints, i)
            _end.fromArray(this.segmentPoints, i + 3)

            maxRadiusSq = Math.max(
                maxRadiusSq,
                center.distanceToSquared(_start),
                center.distanceToSquared(_end)
            )
        }

        this.boundingSphere.radius = Math.sqrt(maxRadiusSq)

        if (isNaN(this.boundingSphere.radius)) {
            console.error(
                "THREE.MultiInstanceLineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The line position data is likely to have NaN values.",
                this
            )
        }
    }
}
