import * as THREE from "three"

// reuse three instances with a closure
const angle = -Math.PI / 2
const subtract = new THREE.Vector3()
const up = new THREE.Vector3(0, 1, 0)
const translateToOrigin = new THREE.Matrix4()
const rotation = new THREE.Matrix4()
const translateBack = new THREE.Matrix4()

/**
 * Computes the projection transform between two points for the drafter preview.
 *
 * The returned matrix rotates a descriptive-geometry shape by 90 degrees around
 * an axis perpendicular to the segment from `A` to `B`, using a pivot halfway
 * between the points and halfway up the span.
 *
 * Reference: https://en.wikipedia.org/wiki/Descriptive_geometry
 *
 * @param A - Previous point in the chain.
 * @param B - Next point in the chain.
 * @param matrix - Optional target matrix to write into.
 * @returns The written matrix together with the derived midpoint and rotation axis.
 */
export function calculateProjectionMatrix(
    A: THREE.Vector3,
    B: THREE.Vector3,
    matrix: THREE.Matrix4 = new THREE.Matrix4()
): {
    matrix: THREE.Matrix4
    midPoint: THREE.Vector3
    axis: THREE.Vector3
} {
    // reset resuable instances
    subtract.subVectors(B, A)
    translateToOrigin.identity()
    rotation.identity()
    translateBack.identity()

    const height = A.distanceTo(B) / 2

    // new instances to return
    const midPoint = new THREE.Vector3()
        .addVectors(A, B)
        .multiplyScalar(0.5)
        .setY(height)
    const axis = up.clone().cross(subtract).normalize()

    // caculate
    translateToOrigin.makeTranslation(-midPoint.x, -midPoint.y, -midPoint.z)
    rotation.makeRotationAxis(axis, angle)
    translateBack.makeTranslation(midPoint)

    //compund
    matrix
        .identity()
        .multiply(translateBack)
        .multiply(rotation)
        .multiply(translateToOrigin)

    return {
        matrix,
        midPoint: midPoint,
        axis: axis,
    }
}

/**
 * Applies an additional transform around an existing world-space origin.
 *
 * This uses the standard pivot sandwich:
 * `T(origin) * extra * T(-origin) * existing`.
 *
 * @param origin - Pivot point to transform around.
 * @param extra - Additional transform to apply at the pivot.
 * @param existing - Matrix that already represents the current transform.
 * @param target - Optional target matrix to write into.
 */
export function applyTransformAroundOrigin(
    origin: THREE.Vector3,
    extra: THREE.Matrix4,
    existing: THREE.Matrix4,
    target: THREE.Matrix4 = new THREE.Matrix4()
): THREE.Matrix4 {
    translateToOrigin.identity()
    translateBack.identity()

    translateToOrigin.makeTranslation(-origin.x, -origin.y, -origin.z)
    translateBack.makeTranslation(origin)

    return target
        .identity()
        .multiply(translateBack)
        .multiply(extra)
        .multiply(translateToOrigin)
        .multiply(existing)
}

/**
 * Writes a matrix into an instanced matrix buffer at the given slot.
 *
 * Set `instanceMatrix.needsUpdate = true` after batching matrix writes so the
 * GPU upload stays in sync.
 *
 * Mirrors the behavior of `THREE.InstancedMesh#setMatrixAt`:
 * https://threejs.org/docs/#api/en/objects/InstancedMesh.setMatrixAt
 *
 * @param instanceMatrix - Backing `InstancedBufferAttribute` for instance matrices.
 * @param index - Instance slot to write.
 * @param matrix - Matrix to serialize into the buffer.
 */
export function setMatrixAt(
    instanceMatrix: THREE.InstancedBufferAttribute,
    index: number,
    matrix: THREE.Matrix4
) {
    matrix.toArray(instanceMatrix.array, index * 16)
}
