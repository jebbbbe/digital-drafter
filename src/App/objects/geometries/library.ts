import * as THREE from "three"
import {
    makeCube,
    makeAsterisk,
    makeCustomBVHShape,
    makeAsteriskAsym,
    makeAsteriskCenter,
    createMengerSpongeCSG,
    makeConeGeometry,
    makeSphereGeometry,
    makeTorusGeometry,
} from "./geometry"
import { normalizeGeometryBox } from "./brushCleaner"

export const geometryLibrary: Record<string, THREE.BufferGeometry> = {
    cube: makeCube(),
    rectangle: makeCube(1, 0.5, 0.5),
    cone: makeConeGeometry(),
    pyramid: makeConeGeometry(1, 1, 4, 1),
    sphere: makeSphereGeometry(),
    torus: makeTorusGeometry(),
    asterisk: makeAsterisk(10),
    asteriskBox: makeAsterisk(0.1),
    asteriskBlob: makeAsteriskCenter(10),
    asteriskAsymetrical: makeAsteriskAsym(10),
    custom: makeCustomBVHShape(),
    menger: createMengerSpongeCSG(2),
}

const _normalizeMatrix = new THREE.Matrix4()
function normalizeAndApplyMatrix(mergedGeometry: THREE.BufferGeometry) {
    normalizeGeometryBox(mergedGeometry, _normalizeMatrix)
    mergedGeometry.applyMatrix4(_normalizeMatrix)
}

for (const key in geometryLibrary) {
    normalizeAndApplyMatrix(geometryLibrary[key])
	geometryLibrary[key].name = key
}

export const geometryTitles: Record<string, THREE.BufferGeometry> = {
    Cube: geometryLibrary.cube,
    Rectangle: geometryLibrary.rectangle,
    Cone: geometryLibrary.cone,
    Pyramid: geometryLibrary.pyramid,
    Sphere: geometryLibrary.sphere,
    Torus: geometryLibrary.torus,
    Asterisk: geometryLibrary.asterisk,
    "Asterisk Box": geometryLibrary.asteriskBox,
    "Asterisk Tree": geometryLibrary.asteriskBlob,
    Custom: geometryLibrary.custom,
    Menger: geometryLibrary.menger,
}
