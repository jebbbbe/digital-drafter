import * as THREE from "three"
import { constants } from "../constants"
import { InstancedLineMaterial } from "../objects/materials/InstancedLineMaterial"
import { ProjectionLineMaterial } from "../objects/materials/ProjectionLineMaterial"
import { ProjectionLineMaterial2 } from "../objects/materials/ProjectionLineMaterial2"
import { patchNodeMatrix } from "../objects/materials/nodeWrapper"
import { LineMaterial } from "three/addons/lines/LineMaterial.js"
import { FoldLineMaterial } from "../objects/materials/FoldLineMaterial"
import { FoldLineMaterial2 } from "../objects/materials/FoldLineMaterial2"

/*

render order issuees.
we have contrained render order, dpth write and read to have certain contraints. 
by adding trancparacy flag, this changes render order. 
will revisit when looking more into line aliasing 

*/
type ActiveMaterialLib = "gl_Line" | "linewidth"
const activeMaterialLib: ActiveMaterialLib = "linewidth"

const display = constants.themes.objects[constants.theme].display as any

const matlib = {
    // outline
    mesh: patchNodeMatrix(
        new THREE.MeshBasicMaterial({
            color: display.mesh.color,
            side: THREE.DoubleSide,
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1,
        })
    ),
    // dash
    // proj
    // fold
    // line
    sectionFace: new THREE.MeshBasicMaterial({
        color: 0xd8abd8, //0xd8abd8,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: true, // nice result on/off
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
        transparent: true,
        opacity: 1,
    }),
    //sectionEdge
    //sectionLine
} as any

// @ts-ignore
if (activeMaterialLib === "gl_Line") {
    matlib.outline = patchNodeMatrix(
        new THREE.LineBasicMaterial({
            color: 0xff0000, //display.line.color,
            depthWrite: false,
        })
    )
    //mesh
    matlib.dash = patchNodeMatrix(
        new THREE.LineDashedMaterial({
            color: display.dash.color,
            dashSize: display.dash.dashSize,
            gapSize: display.dash.gapSize,
            depthTest: false,
            depthWrite: false,
        })
    )
    matlib.projection = new ProjectionLineMaterial({
        color: display.projection.color,
        depthTest: true,
        depthWrite: false,
    })
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
    //sectionFace
    matlib.sectionEdge = new THREE.LineBasicMaterial({
        color: 0x000000,
        depthTest: false,
        depthWrite: false,
        transparent: true,
        opacity: 1,
    })
    matlib.sectionLine = new THREE.LineBasicMaterial({
        color: display.section.color,
        depthTest: true,
        depthWrite: false,
    })
} else {
    matlib.outline = new InstancedLineMaterial({
        color: display.line.color, //0xff0000
        linewidth: 3,
        depthWrite: false,
        // capStyle: 2,
    })
    //mesh
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
    matlib.line = new InstancedLineMaterial({
        color: display.line.color,
        linewidth: 1.25,
        depthWrite: false,
        // capStyle: 2, // rm from implementation for now
    })
    //sectionFace
    matlib.sectionEdge = new LineMaterial({
        color: 0x000000,
        depthTest: false,
        depthWrite: false,
        linewidth: 3.25,
        transparent: true,
        opacity: 1,
    })
    matlib.sectionLine = new LineMaterial({
        color: display.section.color,
        depthTest: true,
        depthWrite: false,
        linewidth: 1.15,
    })
}

const orders = {
    outline: 0,
    mesh: 1,
    dash: 2,
    proj: 2,
    fold: 2,
    line: 4,
    //attachments
    sectionFace: 7,
    sectionEdge: 7,
    sectionLine: 9,
}

// this fix is so we can use OnBeforeRender for builtin materials
// the proper solution is to have one material per isntance unfortunatly
// we can use THREE.UniformGroups to update values foor display, or just do a simple loop over all isntances
// we would need clone/copy methods working for the material wrapper...
matlib.mesh.isShaderMaterial = true
matlib.mesh.uniformsGroups = []
// @ts-ignore
if (activeMaterialLib === "gl_Line") {
    // i would rather remove gl_Line support before fixing this issue.
    // i dont think we need a fallback for this..
    matlib.outline.isShaderMaterial = true
    matlib.outline.uniformsGroups = []
    matlib.dash.isShaderMaterial = true
    matlib.dash.uniformsGroups = []
    matlib.projection.isShaderMaterial = true
    matlib.projection.uniformsGroups = []
    matlib.fold.isShaderMaterial = true
    matlib.fold.uniformsGroups = []
    matlib.line.isShaderMaterial = true
    matlib.line.uniformsGroups = []
}

export { matlib, activeMaterialLib, orders }
