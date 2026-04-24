import * as THREE from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"

export function makeCustomShape() {
    const geo1 = new THREE.BoxGeometry(1, 3, 1)
    const geo2 = new THREE.BoxGeometry(1, 1, 2)
    geo2.translate(1, 0, 0.5)
    geo1.rotateX(Math.PI/4)
    const mergedGeometry = mergeGeometries([geo1, geo2])
    return mergedGeometry
}
