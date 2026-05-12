import * as THREE from "three"

// const _box = new THREE.Box3()
// const _vector = new THREE.Vector3()
/**
 * Builds indexed quad geometry for thick line rendering from segment data, and
 * exposes a matching `DataTexture` for `DataTextureLineMaterial` to read from.
 * Safe to use with InstancedMesh
 * @example
 * ```ts
 * const geo = new DataTextureLineSegmentsGeometry(edges)
 * const mat = new DataTextureLineMaterial({
 *     linewidth: 10,
 *     color: 0xff000,
 *     segments: geo.dataTexture,
 * })
 * const lines = new THREE.Mesh(geo, mat)
 * ```
 */
export class DataTextureLineSegmentsGeometry extends THREE.BufferGeometry {
    typedArray!: THREE.TypedArray
    dataTexture!: THREE.DataTexture

    constructor(
        source?: THREE.TypedArray | THREE.EdgesGeometry | THREE.LineSegments
    ) {
        super()
        // this.type = 'DataTextureLineSegmentsGeometry';

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

    // setColors(){}
    // fromWireframeGeometry(){}
    fromTypedArray(segmentPositions: THREE.TypedArray) {
        this.updateIndexBuffer(segmentPositions)
        return this
    }
    fromEdgesGeometry(geometry: THREE.EdgesGeometry) {
        const segmentPositions = geometry.getAttribute("position").array
        this.updateIndexBuffer(segmentPositions)
        return this
    }
    // fromMesh() {}
    fromLineSegments(lineSegments: THREE.LineSegments) {
        const geometry = lineSegments.geometry
        const segmentPositions = geometry.getAttribute("position").array
        this.updateIndexBuffer(segmentPositions)
        return this
    }
    updateIndexBuffer(segmentPositions: THREE.TypedArray) {
        const segmentCount = segmentPositions.length / 6

        const indices = new Uint32Array(segmentCount * 6)

        for (let i = 0; i < segmentCount; i++) {
            const vertexOffset = i * 4
            const indexOffset = i * 6
            indices[indexOffset + 0] = vertexOffset + 0
            indices[indexOffset + 1] = vertexOffset + 1
            indices[indexOffset + 2] = vertexOffset + 2
            indices[indexOffset + 3] = vertexOffset + 2
            indices[indexOffset + 4] = vertexOffset + 1
            indices[indexOffset + 5] = vertexOffset + 3
        }

        this.setIndex(new THREE.Uint32BufferAttribute(indices, 1))
        // this.index.needsUpdate = true
        this.typedArray = segmentPositions
        this.createDataTexture(segmentPositions)
    }
    createDataTexture(segmentPositions: THREE.TypedArray = this.typedArray) {
        // create data texture here, from refrenced pos buffer.
        // must set in material.
        // updates to the buffer bust be passed. tho i think we can modify the base array from this...

        //creates a DataTexture that works as a LineSegment Position buffer.
        // [a,a, b,b, c,c, ...etc]
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
        this.boundingBox?.setFromArray(this.typedArray)
    }
    computeBoundingSphere() {
        // bad idea? wont work with raycasting..?
        this.setAttribute(
            "position",
            new THREE.BufferAttribute(this.typedArray, 3)
        )

        super.computeBoundingSphere()

        this.deleteAttribute("position")
    }
}
