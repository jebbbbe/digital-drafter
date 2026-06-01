import * as THREE from "three"

const _up = new THREE.Vector3(0, 1, 0)
const _zero = new THREE.Vector3(0, 0, 0)
const _from = new THREE.Vector3()
const _to = new THREE.Vector3()
const _result = new THREE.Vector3()
const _translateToOrigin = new THREE.Matrix4()
const _rotation = new THREE.Matrix4()
const _translateBack = new THREE.Matrix4()

export function getXZRotationAngle(
    origin: THREE.Vector3,
    fromPoint: THREE.Vector3,
    toPoint: THREE.Vector3
): number {
    _from.subVectors(fromPoint, origin)
    _to.subVectors(toPoint, origin)

    return Math.atan2(
        _from.z * _to.x - _from.x * _to.z,
        _from.x * _to.x + _from.z * _to.z
    )
}

export function rotatePointOnXZPlane(
    point: THREE.Vector3,
    angle: number,
    origin: THREE.Vector3 = _zero,
    result: THREE.Vector3 = _result
): THREE.Vector3 {
    result.copy(point)
    result.sub(origin)
    result.applyAxisAngle(_up, angle)
    result.add(origin)

    return result
}

export function rotateMatrixOnXZPlane(
    matrix: THREE.Matrix4,
    angle: number,
    origin: THREE.Vector3 = _zero,
    result: THREE.Matrix4 = matrix
): THREE.Matrix4 {
    _translateToOrigin.makeTranslation(-origin.x, -origin.y, -origin.z)
    _rotation.makeRotationY(angle)
    _translateBack.makeTranslation(origin.x, origin.y, origin.z)
    return result
        .copy(_translateBack)
        .multiply(_rotation)
        .multiply(_translateToOrigin)
        .multiply(matrix)
}
