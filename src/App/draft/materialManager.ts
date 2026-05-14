import * as THREE from "three"
import { constants } from "../constants"
import { DataTextureLineMaterial } from "../objects/materials/DataTextureLineMaterial"
import { InstancedProjectionMaterial } from "../objects/materials/InstancedProjectionMaterial"
import {
    patchDashedLine,
    patchNodeMatrix,
} from "../objects/materials/nodeWrapper"

type ActiveMaterialLib = "gl_Line" | "linewidth"
const activeMaterialLib: ActiveMaterialLib = "linewidth"

const display = constants.themes.objects[constants.theme].display as any

const MaterialsLib = {
    gl_Line: {
        line: patchNodeMatrix(
            new THREE.LineBasicMaterial({
                color: display.line.color,
                // depthTest: true,
            })
        ),
        dash: patchDashedLine(
            patchNodeMatrix(
                new THREE.LineDashedMaterial({
                    color: display.dash.color,
                    dashSize: display.dash.dashSize,
                    gapSize: display.dash.gapSize,
                    depthTest: false,
                })
            )
        ),
        mesh: patchNodeMatrix(
            new THREE.MeshBasicMaterial({
                color: display.mesh.color,
                polygonOffset: true,
                polygonOffsetFactor: 1,
                polygonOffsetUnits: 1,
                // depthWrite: true,
            })
        ),
        projection: new InstancedProjectionMaterial({
            color: display.projection.color,
        }),
    },
    linewidth: {
        line: patchNodeMatrix(
            new DataTextureLineMaterial({
                color: display.line.color,
                linewidth: 1,
                capStyle: 2,
                depthWrite: false, // ?
            })
        ),
        dash: patchDashedLine(
            patchNodeMatrix(
                new THREE.LineDashedMaterial({
                    color: display.dash.color,
                    dashSize: display.dash.dashSize,
                    gapSize: display.dash.gapSize,
                    depthTest: false,
                })
            )
        ),
        mesh: patchNodeMatrix(
            new THREE.MeshBasicMaterial({
                color: display.mesh.color,
                polygonOffset: true,
                polygonOffsetFactor: 3,
                polygonOffsetUnits: 3,
                // depthWrite: true,
            })
        ),
        projection: new InstancedProjectionMaterial({
            color: display.projection.color,
        }),
    },
}

const matlib = MaterialsLib[activeMaterialLib]
export { matlib, activeMaterialLib }
