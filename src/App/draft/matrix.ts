import * as THREE from "three"

// reuse three instances with a closure
const angle = -Math.PI / 2
const subtract = new THREE.Vector3()
const up = new THREE.Vector3(0, 1, 0)
const translateToOrigin = new THREE.Matrix4()
const rotation = new THREE.Matrix4()
const translateBack = new THREE.Matrix4()

/*
jsdoc moc
this caculates the projected transform of a discriptive geometry rotation, 
this can be simulated as a 90 degree rotation about an axis perpendicular to the start end end points, halfay between them and halfway up.
see https://en.wikipedia.org/wiki/Descriptive_geometry
*/

/**
 * @param {THREE.Vector3} A - The Previous Point
 * @param {THREE.Vector3} B - The Next Point
 * @param {THREE.Matrix4} matrix -Oprional matrix to copy result into
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
 * Sets the given local transformation matrix to the defined instance. Make sure you set the `needsUpdate` flag of
 * {@link THREE.InstancedMesh#setMatrixAt} to `true` after updating all the matrices.
 * @param {THREE.InstancedBufferAttribut} instanceMatrix - The InstancedBufferAttribute
 * @param {number} index - The instance index.
 * @param {THREE.Matrix4} matrix - The local transformation.
 */
export function setMatrixAt(
    instanceMatrix: THREE.InstancedBufferAttribute,
    index: number,
    matrix: THREE.Matrix4
) {
    matrix.toArray(instanceMatrix.array, index * 16)
}
