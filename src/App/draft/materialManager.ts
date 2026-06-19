import * as THREE from "three"
import { constants } from "../constants"
import { DataTextureLineMaterial } from "../objects/materials/DataTextureLineMaterial"
import { InstancedLineMaterial } from "../objects/materials/InstancedLineMaterial"
import { InstancedProjectionMaterial } from "../objects/materials/InstancedProjectionMaterial"
import { patchDashedLine, patchNodeMatrix } from "../objects/materials/nodeWrapper"
import { LineMaterial } from "three/addons/lines/LineMaterial.js"
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
        color: display.section.color,
        depthTest: true,
        depthWrite: false,
    }),
    sectionFace: new THREE.MeshBasicMaterial({
        color: 0xffffff, //0xd8abd8,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: true, // nice result on/off
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
    }),
    sectionEdge: new LineMaterial({
        color: 0x000000,
        depthTest: false,
        depthWrite: false,
        linewidth: 2.5,
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
    matlib.outline = patchNodeMatrix(
        new THREE.LineBasicMaterial({
            color: 0xff0000, //display.line.color,
            depthWrite: false,
        })
    )
    matlib.mesh = patchNodeMatrix(
        new THREE.MeshBasicMaterial({
            color: display.mesh.color,
            side: THREE.DoubleSide,
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1,
        })
    )
} else {
    matlib.line = new InstancedLineMaterial({
        color: display.line.color,
        linewidth: 1.25,
        // capStyle: 2, // rm from implementation for now
        depthWrite: false,
    })
    matlib.outline = new DataTextureLineMaterial({
        color: display.line.color, //0xff0000
        linewidth: 10.75,
        capStyle: 2,
        depthWrite: false,
    })
    matlib.mesh = patchNodeMatrix(
        new THREE.MeshBasicMaterial({
            color: display.mesh.color,
            side: THREE.DoubleSide,
            polygonOffset: true,
            polygonOffsetFactor: 3,
            polygonOffsetUnits: 3,
        })
    )
}

const orders = {
    outline: 0,
    mesh: 1,
    dash: 2,
    proj: 2,
    fold: 2,
    line: 4,
    //attachments
    sectionLine: 9,
    sectionFace: 7,
    sectionEdge: 7,
}

export { matlib, activeMaterialLib, orders }
