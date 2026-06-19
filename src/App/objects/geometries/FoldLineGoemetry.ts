import * as THREE from "three"

const foldLineGeometry = new THREE.BufferGeometry()
const foldAttribute = new THREE.BufferAttribute(new Uint8Array(3 * 4), 3)

export function newFoldLineGeometry() {
    const fl = foldLineGeometry.clone()
    fl.setAttribute("position", foldAttribute)
    return fl
}
