import * as THREE from "three"
import { LineMaterial } from "three/addons/lines/LineMaterial.js"
import { settings } from "../settings"
import {
    InstancedLineMaterial,
    ProjectionLineMaterial,
    ProjectionLineMaterial2,
    patchNodeMatrix,
    FoldLineMaterial,
    FoldLineMaterial2,
} from "../objects/materials"

/*

render order issuees.
we have contrained render order, dpth write and read to have certain contraints. 
by adding trancparacy flag, this changes render order. 
will revisit when looking more into line aliasing 

*/
type ActiveMaterialLib = "gl_Line" | "linewidth"
const activeMaterialLib: ActiveMaterialLib = "linewidth"

const materialSettings = settings.display.materials
// console.log(display)

const matlib = {
    // outline
    mesh: patchNodeMatrix(
        new THREE.MeshBasicMaterial({
            ...materialSettings.mesh,
            side: THREE.DoubleSide,
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1,
        })
    ),
    sectionFace: new THREE.MeshBasicMaterial({
        ...materialSettings.sectionFace,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: true, // nice result on/off
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
        transparent: true,
    }),
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
            color: materialSettings.dash.color,
            dashSize: materialSettings.dash.dashSize,
            gapSize: materialSettings.dash.gapSize,
            depthTest: false,
            depthWrite: false,
        })
    )
    matlib.projection = new ProjectionLineMaterial({
        color: materialSettings.projection.color,
        depthTest: true,
        depthWrite: false,
    })
    matlib.fold = new FoldLineMaterial({
        color: materialSettings.fold.color,
        foldDistance: materialSettings.fold.foldDistance,
        foldSize: materialSettings.fold.foldSize,
        depthTest: true,
        depthWrite: false,
    })
    matlib.line = patchNodeMatrix(
        new THREE.LineBasicMaterial({
            color: materialSettings.line.color,
            depthWrite: false,
        })
    )
    //sectionFace
    matlib.sectionEdge = new THREE.LineBasicMaterial({
        color: materialSettings.sectionEdge.color,
        depthTest: false,
        depthWrite: false,
        transparent: true,
        opacity: 1,
    })
    matlib.sectionLine = new THREE.LineBasicMaterial({
        color: materialSettings.sectionLine.color,
        depthTest: true,
        depthWrite: false,
    })
} else {
    matlib.outline = new InstancedLineMaterial({
        ...materialSettings.outline,
        depthWrite: false,
    })
    //mesh
    matlib.dash = new InstancedLineMaterial({
        ...materialSettings.dash,
        depthTest: false,
        depthWrite: false,
    })
    matlib.projection = new ProjectionLineMaterial2({
        ...materialSettings.projection,
        depthTest: true,
        depthWrite: false,
        alphaToCoverage: false, // need to test
    })
    matlib.fold = new FoldLineMaterial2({
        ...materialSettings.fold,
        depthTest: true,
        depthWrite: false,
    })
    matlib.line = new InstancedLineMaterial({
        ...materialSettings.line,
        depthWrite: false,
    })
    //sectionFace
    matlib.sectionEdge = new LineMaterial({
        ...materialSettings.sectionEdge,
        depthTest: false,
        depthWrite: false,
    })
    matlib.sectionLine = new LineMaterial({
        ...materialSettings.sectionLine,
        depthTest: true,
        depthWrite: false,
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
