import * as THREE from "three"

export const updateBySet = <T extends { set: (...args: any[]) => any }>(
    o: T,
    v: any
): void => {
    void (Array.isArray(v)
        ? o.set.apply(o, v)
        : typeof v === "object"
          ? o.set.apply(o, Object.values(v))
          : o.set(v))
}

export const updateByCopy = <T extends { copy: (v: T) => any }>(
    o: T,
    v: any
): boolean => {
    if (v?.constructor !== o.constructor) return false
    o.copy(v)
    return true
}

const vals = (v: any) => (Array.isArray(v) ? v : Object.values(v))

export const updateColor = (o: THREE.Color, v: any): void => {
    if (v && typeof v === "object") {
        const [r, g, b] = vals(v)
        o.setRGB(r, g, b)
        return
    }
    o.set(v)
}

// prettier-ignore
export const updateVector2 = (o: THREE.Vector2, v: any): void => void o.fromArray(vals(v))
// prettier-ignore
export const updateVector3 = (o: THREE.Vector3, v: any): void => void o.fromArray(vals(v))
// prettier-ignore
export const updateVector4 = (o: THREE.Vector4, v: any): void => void o.fromArray(vals(v))
// prettier-ignore
export const updateQuaternion = (o: THREE.Quaternion, v: any): void => void o.fromArray(vals(v))
// prettier-ignore
export const updateMatrix2 = (o: THREE.Matrix2, v: any): void => void o.fromArray(v?.isMatrix2 ? v.elements : vals(v))
// prettier-ignore
export const updateMatrix3 = (o: THREE.Matrix3, v: any): void => void (v?.isMatrix3 ? o.copy(v) : o.fromArray(vals(v)))
// prettier-ignore
export const updateMatrix4 = (o: THREE.Matrix4, v: any): void => void (v?.isMatrix4 ? o.copy(v) : o.fromArray(vals(v)))

export const updateObject = <T extends object>(o: T, v: Partial<T>): void => {
    for (const k in v) {
        const a: any = (o as any)[k],
            b: any = (v as any)[k]
        if (a?.isColor) updateColor(a, b)
        else if (a?.isVector2) updateVector2(a, b)
        else if (a?.isVector3) updateVector3(a, b)
        else if (a?.isVector4) updateVector4(a, b)
        else if (a?.isQuaternion) updateQuaternion(a, b)
        else if (a?.isMatrix2) updateMatrix2(a, b)
        else if (a?.isMatrix3) updateMatrix3(a, b)
        else if (a?.isMatrix4) updateMatrix4(a, b)
        else (o as any)[k] = b
    }
}

export const updateStandardMaterial = (
    m: THREE.MeshStandardMaterial,
    v: Partial<THREE.MeshStandardMaterial>
): void => {
    updateObject(m, v)
    m.needsUpdate = true
}
