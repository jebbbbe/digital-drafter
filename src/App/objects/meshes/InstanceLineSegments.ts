import * as THREE from "three"

const _identity = new THREE.Matrix4()
const _instanceLocalMatrix = new THREE.Matrix4()
const _instanceWorldMatrix = new THREE.Matrix4()
const _box3 = new THREE.Box3()
const _sphere = new THREE.Sphere()
const _line = new THREE.LineSegments()
const _instanceIntersects: THREE.Intersection[] = []

function cloneInstancedAttribute(
    attribute: THREE.InstancedBufferAttribute | null
) {
    if (attribute === null) return null

    return new THREE.InstancedBufferAttribute(
        new Float32Array(attribute.array),
        attribute.itemSize,
        attribute.normalized,
        attribute.meshPerAttribute
    )
}

/**
 * Instanced line segments that mirror `THREE.InstancedMesh` behavior while
 * keeping the line render and raycast pipeline from `THREE.LineSegments`.
 */
export class InstanceLineSegments<
    TMaterial extends THREE.Material = THREE.LineBasicMaterial,
> extends THREE.LineSegments {
    isInstancedMesh: true
    declare material: TMaterial
    instanceMatrix: THREE.InstancedBufferAttribute
    previousInstanceMatrix: THREE.InstancedBufferAttribute | null
    instanceColor: THREE.InstancedBufferAttribute | null
    morphTexture: THREE.DataTexture | null
    count: number
    boundingBox: THREE.Box3 | null
    boundingSphere: THREE.Sphere | null

    constructor(
        geometry: THREE.BufferGeometry = new THREE.BufferGeometry(),
        material: TMaterial = new THREE.LineBasicMaterial() as unknown as TMaterial,
        count: number
    ) {
        super(geometry, material)

        this.isInstancedMesh = true
        this.instanceMatrix = new THREE.InstancedBufferAttribute(
            new Float32Array(count * 16),
            16
        )
        this.previousInstanceMatrix = null
        this.instanceColor = null
        this.morphTexture = null
        this.count = count
        this.boundingBox = null
        this.boundingSphere = null

        for (let i = 0; i < count; i++) {
            this.setMatrixAt(i, _identity)
        }
    }

    /**
     * Copies this instance's local matrix into `matrix`.
     */
    getMatrixAt(index: number, matrix: THREE.Matrix4) {
        matrix.fromArray(this.instanceMatrix.array, index * 16)
    }

    /**
     * Writes `matrix` into the instanced matrix buffer at `index`.
     */
    setMatrixAt(index: number, matrix: THREE.Matrix4) {
        matrix.toArray(this.instanceMatrix.array, index * 16)
    }

    /**
     * Computes a world-space bounding box across all active line instances.
     */
    computeBoundingBox() {
        const geometry = this.geometry
        const count = this.count

        if (this.boundingBox === null) {
            this.boundingBox = new THREE.Box3()
        }

        if (geometry.boundingBox === null) {
            geometry.computeBoundingBox()
        }

        this.boundingBox.makeEmpty()

        for (let i = 0; i < count; i++) {
            this.getMatrixAt(i, _instanceLocalMatrix)
            _box3.copy(geometry.boundingBox!).applyMatrix4(_instanceLocalMatrix)
            this.boundingBox.union(_box3)
        }
    }

    /**
     * Computes a world-space bounding sphere across all active line instances.
     */
    computeBoundingSphere() {
        const geometry = this.geometry
        const count = this.count

        if (this.boundingSphere === null) {
            this.boundingSphere = new THREE.Sphere()
        }

        if (geometry.boundingSphere === null) {
            geometry.computeBoundingSphere()
        }

        this.boundingSphere.makeEmpty()

        for (let i = 0; i < count; i++) {
            this.getMatrixAt(i, _instanceLocalMatrix)
            _sphere
                .copy(geometry.boundingSphere!)
                .applyMatrix4(_instanceLocalMatrix)
            this.boundingSphere.union(_sphere)
        }
    }

    copy(source: this, recursive?: boolean) {
        super.copy(source, recursive)

        this.instanceMatrix = new THREE.InstancedBufferAttribute(
            new Float32Array(source.instanceMatrix.array),
            source.instanceMatrix.itemSize,
            source.instanceMatrix.normalized,
            source.instanceMatrix.meshPerAttribute
        )
        this.previousInstanceMatrix = cloneInstancedAttribute(
            source.previousInstanceMatrix
        )
        this.instanceColor = cloneInstancedAttribute(source.instanceColor)
        this.morphTexture = source.morphTexture?.clone() ?? null
        this.count = source.count
        this.boundingBox = source.boundingBox?.clone() ?? null
        this.boundingSphere = source.boundingSphere?.clone() ?? null

        return this
    }

    /**
     * Raycasts each active instance and annotates hits with `instanceId`.
     */
    raycast(raycaster: THREE.Raycaster, intersects: THREE.Intersection[]) {
        const matrixWorld = this.matrixWorld
        const raycastTimes = this.count

        _line.geometry = this.geometry
        _line.material = this.material

        if (_line.material === undefined) return

        if (this.boundingSphere === null) {
            this.computeBoundingSphere()
        }

        _sphere.copy(this.boundingSphere!)
        _sphere.applyMatrix4(matrixWorld)

        if (raycaster.ray.intersectsSphere(_sphere) === false) return

        for (let instanceId = 0; instanceId < raycastTimes; instanceId++) {
            this.getMatrixAt(instanceId, _instanceLocalMatrix)
            _instanceWorldMatrix.multiplyMatrices(
                matrixWorld,
                _instanceLocalMatrix
            )

            _line.matrixWorld = _instanceWorldMatrix
            _line.raycast(raycaster, _instanceIntersects)

            for (let i = 0, l = _instanceIntersects.length; i < l; i++) {
                const intersect = _instanceIntersects[i]
                intersect.instanceId = instanceId
                intersect.object = this
                intersects.push(intersect)
            }

            _instanceIntersects.length = 0
        }
    }

    /**
     * Dispatches a dispose event to match Three's disposable object pattern.
     */
    dispose() {
        this.dispatchEvent({ type: "dispose" } as any)
    }
}
