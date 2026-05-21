import {
    makeCube,
    makeAsterix,
    makeCustomBVHShape,
    makeAsterixAsym,
    makeAsterixCenter,
} from "./geometry"

export const geometryLibrary = {
    cube: makeCube(),
    rectangle: makeCube(1, 0.5, 0.5),
    asterix: makeAsterix(10),
    asterixBox: makeAsterix(0.1),
    asterixBlob: makeAsterixCenter(10),
    asterixAsymetrical: makeAsterixAsym(10),
    custom: makeCustomBVHShape(),
}

export const geometryTitles = {
    Cube: geometryLibrary.cube,
    Rectangle: geometryLibrary.rectangle,
    Asterix: geometryLibrary.asterix,
    "Asterix Box": geometryLibrary.asterixBox,
    "Asterix Tree": geometryLibrary.asterixBlob,
    Custom: geometryLibrary.custom,
}
