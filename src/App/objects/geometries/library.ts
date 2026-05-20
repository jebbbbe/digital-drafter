import {
    makeCube,
    makeAsterix,
    makeCustomBVHShape,
    makeAsterixAsym,
    makeAsterixCenter,
} from "./geometry"

export const geoOptions = {}

export const geometryLibrary = {
    cube: makeCube(),
    rectangle: makeCube(1, 0.5, 0.5),
    asterixBox: makeAsterix(0.1),
    asterix: makeAsterix(10),
    asterixBlob: makeAsterixCenter(10),
    asterixAsymetrical: makeAsterixAsym(10),
    custom: makeCustomBVHShape(),
}
