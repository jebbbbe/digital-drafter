import * as THREE from "three"
import { constants } from "../constants"
import { DataTextureLineMaterial } from "../objects/materials/DataTextureLineMaterial"
import { InstancedProjectionMaterial } from "../objects/materials/InstancedProjectionMaterial"
import { GlobalNodeBasicMaterial } from "../objects/materials/GlobalNodeBasicMaterial"
0
type ActiveMaterialLib = "gl_Line" | "linewidth" | "globalNode"
const activeMaterialLib: ActiveMaterialLib = "globalNode"

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
    globalNode: {
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
        mesh: new GlobalNodeBasicMaterial({
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
}

const matlib = MaterialsLib[activeMaterialLib]
export { matlib, activeMaterialLib }
