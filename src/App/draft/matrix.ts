import * as THREE from "three"

export function calculateMatrix(
    Ao: THREE.Vector3,
    Bo: THREE.Vector3,
    // rD: boolean
) {
    // A inital Point, B final Point, implement rD
    let A = Ao.clone()
    let B = Bo.clone()
    const up = new THREE.Vector3(0, 1, 0)
    const height = A.distanceTo(B) / 2
    const midPoint = new THREE.Vector3()
        .addVectors(A, B)
        .multiplyScalar(0.5)
        .setY(height)
    const angle = -Math.PI / 2
    const axis = up.cross(new THREE.Vector3().subVectors(B, A)).normalize()

    // mat.makeTranslation(midPoint.multiplyScalar(-1))
    // mat.makeRotationAxis(axis.normalize(), angle);
    // mat.makeTranslation(midPoint.multiplyScalar(-1))
    // const translateToOrigin = new THREE.Matrix4().makeTranslation(midPoint.multiplyScalar(-1))
    const translateToOrigin = new THREE.Matrix4().makeTranslation(
        -midPoint.x,
        -midPoint.y,
        -midPoint.z
    )
    const rotation = new THREE.Matrix4().makeRotationAxis(axis, angle)
    const translateBack = new THREE.Matrix4().makeTranslation(
        midPoint.x,
        midPoint.y,
        midPoint.z
    )
    return {
        // matrix:new THREE.Matrix4().multiply(translateToOrigin).multiply(rotation).multiply(translateBack),
        matrix: new THREE.Matrix4()
            .multiply(translateBack)
            .multiply(rotation)
            .multiply(translateToOrigin),
        midPoint: midPoint,
        axis: axis,
    }
}
