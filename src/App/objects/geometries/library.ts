import {
    makeCube,
    makeAsterisk,
    makeCustomBVHShape,
    makeAsteriskAsym,
    makeAsteriskCenter,
} from "./geometry"

export const geometryLibrary = {
    cube: makeCube(),
    rectangle: makeCube(1, 0.5, 0.5),
    asterisk: makeAsterisk(10),
    asteriskBox: makeAsterisk(0.1),
    asteriskBlob: makeAsteriskCenter(10),
    asteriskAsymetrical: makeAsteriskAsym(10),
    custom: makeCustomBVHShape(),
}

export const geometryTitles = {
    Cube: geometryLibrary.cube,
    Rectangle: geometryLibrary.rectangle,
    Asterisk: geometryLibrary.asterisk,
    "Asterisk Box": geometryLibrary.asteriskBox,
    "Asterisk Tree": geometryLibrary.asteriskBlob,
    Custom: geometryLibrary.custom,
}
