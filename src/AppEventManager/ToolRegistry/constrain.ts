import * as THREE from "three"

const _zero = new THREE.Vector3()

export function constrainDirection(
    target: THREE.Vector3,
    direction: THREE.Vector3,
    origin: THREE.Vector3 = _zero,
    start = -Infinity,
    end = Infinity
) {
    const directionLengthSq = direction.lengthSq()
    if (directionLengthSq === 0) return target.copy(origin)

    const t = target.sub(origin).dot(direction) / directionLengthSq
    const clampedT = Math.min(end, Math.max(start, t))

    return target.copy(origin).addScaledVector(direction, clampedT)
}

export function constrainDistance(a: THREE.Vector3, distance: number) {}
