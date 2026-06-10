import {
    Box3,
    Float32BufferAttribute,
    InstancedBufferGeometry,
    InstancedInterleavedBuffer,
    InterleavedBufferAttribute,
    Sphere,
    Vector3,
    WireframeGeometry,
} from "three"

const _box = new Box3()
const _vector = new Vector3()

class InstancedLineSegmentsGeometry extends InstancedBufferGeometry {
    constructor() {
        super()

        //@ts-ignore
        this.isLineSegmentsGeometry = true
        //@ts-ignore
        this.isInstancedLineSegmentsGeometry = true

        ;(this as any).type = "InstancedLineSegmentsGeometry"

        const positions = [
            -1, 2, 0, 1, 2, 0, -1, 1, 0, 1, 1, 0, -1, 0, 0, 1, 0, 0, -1, -1, 0,
            1, -1, 0,
        ]
        const uvs = [-1, 2, 1, 2, -1, 1, 1, 1, -1, -1, 1, -1, -1, -2, 1, -2]
        const index = [0, 2, 1, 2, 3, 1, 2, 4, 3, 4, 5, 3, 4, 6, 5, 6, 7, 5]

        this.setIndex(index)
        this.setAttribute("position", new Float32BufferAttribute(positions, 3))
        this.setAttribute("uv", new Float32BufferAttribute(uvs, 2))
    }

    //@ts-ignore
    applyMatrix4(matrix) {
        const start = this.attributes.instanceStart
        const end = this.attributes.instanceEnd

        if (start !== undefined) {
            start.applyMatrix4(matrix)
            end.applyMatrix4(matrix)
            start.needsUpdate = true
        }

        if (this.boundingBox !== null) {
            this.computeBoundingBox()
        }

        if (this.boundingSphere !== null) {
            this.computeBoundingSphere()
        }

        return this
    }

    //@ts-ignore
    setPositions(array) {
        let lineSegments

        if (array instanceof Float32Array) {
            lineSegments = array
        } else if (Array.isArray(array)) {
            lineSegments = new Float32Array(array)
        }

        //@ts-ignore
        const instanceBuffer = new InstancedInterleavedBuffer(lineSegments, 6, 8) // xyz, xyz

        this.setAttribute(
            "instanceStart",
            new InterleavedBufferAttribute(instanceBuffer, 3, 0)
        )
        this.setAttribute(
            "instanceEnd",
            new InterleavedBufferAttribute(instanceBuffer, 3, 3)
        )

        this.instanceCount = this.attributes.instanceStart.count * 8

        this.computeBoundingBox()
        this.computeBoundingSphere()

        return this
    }

    //@ts-ignore
    setColors(array) {
        let colors

        if (array instanceof Float32Array) {
            colors = array
        } else if (Array.isArray(array)) {
            colors = new Float32Array(array)
        }

        //@ts-ignore
        const instanceColorBuffer = new InstancedInterleavedBuffer(colors, 6, 8) // rgb, rgb

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

        const start = this.attributes.instanceStart
        const end = this.attributes.instanceEnd

        if (start !== undefined && end !== undefined) {
            //@ts-ignore
            this.boundingBox.setFromBufferAttribute(start)
            //@ts-ignore
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

        const start = this.attributes.instanceStart
        const end = this.attributes.instanceEnd

        if (start !== undefined && end !== undefined) {
            const center = this.boundingSphere.center

            //@ts-ignore
            this.boundingBox.getCenter(center)

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
                    "THREE.InstancedLineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",
                    this
                )
            }
        }
    }
}

export { InstancedLineSegmentsGeometry }
