import * as THREE from "three"
import { constants } from "../constants"
import { InstancedLineMaterial } from "../objects/materials/InstancedLineMaterial"
import { ProjectionLineMaterial } from "../objects/materials/ProjectionLineMaterial"
import { ProjectionLineMaterial2 } from "../objects/materials/ProjectionLineMaterial2"
import { patchNodeMatrix } from "../objects/materials/nodeWrapper"
import { LineMaterial } from "three/addons/lines/LineMaterial.js"
import { FoldLineMaterial } from "../objects/materials/FoldLineMaterial"
import { FoldLineMaterial2 } from "../objects/materials/FoldLineMaterial2"

type ActiveMaterialLib = "gl_Line" | "linewidth"
const activeMaterialLib: ActiveMaterialLib = "linewidth"

const display = constants.themes.objects[constants.theme].display as any

const matlib = {
    projection: new ProjectionLineMaterial({
        color: display.projection.color,
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
        linewidth: 3.25,
    }),
} as any

// @ts-ignore
if (activeMaterialLib === "gl_Line") {
    matlib.dash = patchNodeMatrix(
        new THREE.LineDashedMaterial({
            color: display.dash.color,
            dashSize: display.dash.dashSize,
            gapSize: display.dash.gapSize,
            depthTest: false,
            depthWrite: false,
        })
    )
    matlib.fold = new FoldLineMaterial({
        color: display.fold.color,
        foldDistance: display.fold.foldDistance,
        foldSize: display.fold.foldSize,
        depthTest: true,
        depthWrite: false,
    })
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
        depthWrite: false,
        // capStyle: 2, // rm from implementation for now
    })
    matlib.outline = new InstancedLineMaterial({
        color: display.line.color, //0xff0000
        linewidth: 3,
        depthWrite: false,
        // capStyle: 2,
    })
    matlib.dash = new InstancedLineMaterial({
        color: display.dash.color,
        linewidth: 0.75,
        dashed: true,
        dashScale: 1,
        dashSize: display.dash.dashSize,
        gapSize: display.dash.gapSize,
        depthTest: false,
        depthWrite: false,
		transparent: true,
        opacity: 0.5,
    })
    matlib.projection = new ProjectionLineMaterial2({
        color: display.projection.color,
        linewidth: 1,
        depthTest: true,
        depthWrite: false,
        transparent: true,
        opacity: 0.1,
        // alphaToCoverage: true,
    })
    matlib.fold = new FoldLineMaterial2({
        color: display.fold.color,
        foldDistance: display.fold.foldDistance,
        foldSize: display.fold.foldSize,
        linewidth: 1,
        depthTest: true,
        depthWrite: false,
        transparent: true,
        opacity: 0.4,
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
