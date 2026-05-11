import * as THREE from "three"
import { constants } from "../constants"
import { DataTextureLineMaterial } from "../objects/materials/DataTextureLineMaterial"
import { InstancedProjectionMaterial } from "../objects/materials/InstancedProjectionMaterial"

type ActiveMaterialLib = "gl_Line" | "linewidth"
const activeMaterialLib: ActiveMaterialLib = "linewidth"

const display = constants.themes.objects[constants.theme].display as any

const MaterialsLib = {
    gl_Line: {
        line: new THREE.LineBasicMaterial({
            color: display.line.color,
            // depthTest: true,
        }),
        dash: new THREE.LineDashedMaterial({
            color: display.dash.color,
            dashSize: 0.05,
            gapSize: 0.01,
            depthTest: false,
        }),
        mesh: new THREE.MeshBasicMaterial({
            color: display.mesh.color,
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1,
            // depthWrite: true,
        }),
        // this one needs to be cloned everytime
        projection: new InstancedProjectionMaterial({
            color: display.projection.color,
        }),
    },
    linewidth: {
        line: new DataTextureLineMaterial({
            color: display.line.color,
            linewidth: 1,
            capStyle: 2,
            depthWrite: false, // ?
        }),
        dash: new THREE.LineDashedMaterial({
            color: display.dash.color,
            dashSize: 0.05,
            gapSize: 0.01,
            depthTest: false,
        }),
        mesh: new THREE.MeshBasicMaterial({
            color: display.mesh.color,
            polygonOffset: true,
            polygonOffsetFactor: 3,
            polygonOffsetUnits: 3,
            // depthWrite: true,
        }),
        // this one needs to be cloned everytime
        projection: new InstancedProjectionMaterial({
            color: display.projection.color,
        }),
    },
}

const matlib = MaterialsLib[activeMaterialLib]
export { matlib, activeMaterialLib }
