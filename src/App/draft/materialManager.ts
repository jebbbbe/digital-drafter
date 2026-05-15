import * as THREE from "three"
import { constants } from "../constants"
import { DataTextureLineMaterial } from "../objects/materials/DataTextureLineMaterial"
import { InstancedProjectionMaterial } from "../objects/materials/InstancedProjectionMaterial"
import {
    patchDashedLine,
    patchNodeMatrix,
} from "../objects/materials/nodeWrapper"

import { FoldLineMaterial } from "../objects/materials/FoldLineMaterial"

type ActiveMaterialLib = "gl_Line" | "linewidth"
const activeMaterialLib: ActiveMaterialLib = "linewidth"

const display = constants.themes.objects[constants.theme].display as any

const matlib = {
    dash: patchDashedLine(
        patchNodeMatrix(
            new THREE.LineDashedMaterial({
                color: display.dash.color,
                dashSize: display.dash.dashSize,
                gapSize: display.dash.gapSize,
                depthTest: false,
                depthWrite: false,
            })
        )
    ),
    projection: new InstancedProjectionMaterial({
        color: display.projection.color,
        depthTest: true,
        depthWrite: false,
    }),
    fold: new FoldLineMaterial({
        color: display.fold.color,
        foldDistance: display.fold.foldDistance,
        foldSize: display.fold.foldSize,
        depthTest: true,
        depthWrite: false,
    }),
    section: new THREE.LineBasicMaterial({
        color: 0xff00ff,
        depthTest: true,
        depthWrite: false,
    }),
} as any

// @ts-ignore
if (activeMaterialLib === "gl_Line") {
    matlib.line = patchNodeMatrix(
        new THREE.LineBasicMaterial({
            color: display.line.color,
            depthWrite: false,
        })
    )
    matlib.mesh = patchNodeMatrix(
        new THREE.MeshBasicMaterial({
            color: display.mesh.color,
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1,
        })
    )
} else {
    matlib.line = patchNodeMatrix(
        new DataTextureLineMaterial({
            color: display.line.color,
            linewidth: 1,
            capStyle: 2,
            depthWrite: false,
        })
    )
    matlib.mesh = patchNodeMatrix(
        new THREE.MeshBasicMaterial({
            color: display.mesh.color,
            polygonOffset: true,
            polygonOffsetFactor: 3,
            polygonOffsetUnits: 3,
        })
    )
}

export { matlib, activeMaterialLib }
