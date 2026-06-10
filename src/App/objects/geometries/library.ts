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

export const geometryLibrary = {
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

export const geometryTitles = {
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
