import * as THREE from "three"
import { levaStore } from "leva"
import type { SettingsDisplay } from "../../App/themes/default"

export const panelPaths = {
    insert: "Insert",
    theme: "Settings.theme",
    background: "Settings.Display.Background",
    meshColor: "Settings.Display.Mesh.meshColor",
    meshVisible: "Settings.Display.Mesh.meshVisible",
    meshOpacity: "Settings.Display.Mesh.meshOpacity",
    lineColor: "Settings.Display.Line.lineColor",
    lineVisible: "Settings.Display.Line.lineVisible",
    lineOpacity: "Settings.Display.Line.lineOpacity",
    lineWidth: "Settings.Display.Line.lineWidth",
    outlineColor: "Settings.Display.Outline.outlineColor",
    outlineOpacity: "Settings.Display.Outline.outlineOpacity",
    outlineWidth: "Settings.Display.Outline.outlineWidth",
    dashColor: "Settings.Display.Dash.dashColor",
    dashVisible: "Settings.Display.Dash.dashVisible",
    dashOpacity: "Settings.Display.Dash.dashOpacity",
    dashSize: "Settings.Display.Dash.dashSize",
    gapSize: "Settings.Display.Dash.gapSize",
    projectionColor: "Settings.Display.Projection.projectionColor",
    projectionVisible: "Settings.Display.Projection.projectionVisible",
    projectionOpacity: "Settings.Display.Projection.projectionOpacity",
    projectionWidth: "Settings.Display.Projection.projectionWidth",
    foldColor: "Settings.Display.Fold.foldColor",
    foldVisible: "Settings.Display.Fold.foldVisible",
    foldOpacity: "Settings.Display.Fold.foldOpacity",
    foldWidth: "Settings.Display.Fold.foldWidth",
    foldDistance: "Settings.Display.Fold.foldDistance",
    foldSize: "Settings.Display.Fold.foldSize",
    sectionFaceColor: "Settings.Display.Section.sectionFaceColor",
    sectionFaceOpacity: "Settings.Display.Section.sectionFaceOpacity",
    sectionEdgeColor: "Settings.Display.Section.sectionEdgeColor",
    sectionEdgeOpacity: "Settings.Display.Section.sectionEdgeOpacity",
    sectionEdgeWidth: "Settings.Display.Section.sectionEdgeWidth",
    sectionLineColor: "Settings.Display.Section.sectionLineColor",
    sectionLineOpacity: "Settings.Display.Section.sectionLineOpacity",
    sectionLineWidth: "Settings.Display.Section.sectionLineWidth",

    stubPos: "Selection.position",
    stubRot: "Selection.rotate",
    stubScale: "Selection.scale",
    stubButton: "Selection.buttonGroup", // not able to disable..?
    stubAdd: "Selection.Add View",
    stubDelete: "Selection.Delete View",
    stubCut: "Selection.Section Cut",
    stubMirror: "Selection.Mirror View",
    stubDetach: "Selection.Detach View",
    stubDetachChildren: "Selection.Detach Children",
    stubUnion: "Selection.Union View",
    stubDifference: "Selection.Difference View",
    stubIntersect: "Selection.Intersect View",
    stubSaveObject: "Selection.Save Object",
    stubAddLibrary: "Selection.Add Object to Library",
}

export function syncLevaDisplayControls(display: SettingsDisplay): void {
    // console.log({ display })
    // console.log({ levaStore })
    const materials = display.materials
    // const objects = display.objects

    levaStore.set(
        {
            [panelPaths.background]: display.background,
            [panelPaths.meshColor]: materials.mesh.color,
            // [panelPaths.meshVisible]: objects.mesh.visible,
            // [panelPaths.meshOpacity]: materials.mesh.opacity,
            [panelPaths.lineColor]: materials.line.color,
            // [panelPaths.lineVisible]: objects.line.visible,
            // [panelPaths.lineOpacity]: materials.line.opacity,
            [panelPaths.lineWidth]: materials.line.linewidth,
            [panelPaths.outlineColor]: materials.outline.color,
            // [panelPaths.outlineOpacity]: materials.outline.opacity,
            [panelPaths.outlineWidth]: materials.outline.linewidth,
            [panelPaths.dashColor]: materials.dash.color,
            // [panelPaths.dashVisible]: objects.dash.visible,
            // [panelPaths.dashOpacity]: materials.dash.opacity,
            [panelPaths.dashSize]: materials.dash.dashSize,
            [panelPaths.gapSize]: materials.dash.gapSize,
            [panelPaths.projectionColor]: materials.projection.color,
            // [panelPaths.projectionVisible]: objects.projection.visible,
            // [panelPaths.projectionOpacity]: materials.projection.opacity,
            [panelPaths.projectionWidth]: materials.projection.linewidth,
            [panelPaths.foldColor]: materials.fold.color,
            // [panelPaths.foldVisible]: objects.fold.visible,
            // [panelPaths.foldOpacity]: materials.fold.opacity,
            [panelPaths.foldWidth]: materials.fold.linewidth,
            [panelPaths.foldDistance]: materials.fold.foldDistance,
            [panelPaths.foldSize]: materials.fold.foldSize,
            [panelPaths.sectionFaceColor]: materials.sectionFace.color,
            // [panelPaths.sectionFaceOpacity]: materials.sectionFace.opacity,
            [panelPaths.sectionEdgeColor]: materials.sectionEdge.color,
            // [panelPaths.sectionEdgeOpacity]: materials.sectionEdge.opacity,
            [panelPaths.sectionEdgeWidth]: materials.sectionEdge.linewidth,
            [panelPaths.sectionLineColor]: materials.sectionLine.color,
            // [panelPaths.sectionLineOpacity]: materials.sectionLine.opacity,
            [panelPaths.sectionLineWidth]: materials.sectionLine.linewidth,
        },
        false
    )
}

export function syncLevaDisplayStub({
    positionValue,
    rotateValue,
    scaleValue,
}: any): void {
    const sync = {} as any

    if (positionValue !== undefined) {
        sync[panelPaths.stubPos] = positionValue
    }
    if (rotateValue !== undefined) {
        sync[panelPaths.stubRot] = rotateValue
    }
    if (scaleValue !== undefined) {
        sync[panelPaths.stubScale] = scaleValue
    }
    levaStore.set(sync, false)
}

// STUB panel
function setButtonsDisabled(disabled: boolean = true) {
    // levaStore.setSettingsAtPath(panelPaths.stubButton, { disabled })
    levaStore.setSettingsAtPath(panelPaths.stubAdd, { disabled })
    levaStore.setSettingsAtPath(panelPaths.stubDelete, { disabled })
    levaStore.setSettingsAtPath(panelPaths.stubCut, { disabled })
    levaStore.setSettingsAtPath(panelPaths.stubDetach, { disabled })
    levaStore.setSettingsAtPath(panelPaths.stubDetachChildren, { disabled })
    levaStore.setSettingsAtPath(panelPaths.stubMirror, { disabled })
    levaStore.setSettingsAtPath(panelPaths.stubUnion, { disabled })
    levaStore.setSettingsAtPath(panelPaths.stubDifference, { disabled })
    levaStore.setSettingsAtPath(panelPaths.stubIntersect, { disabled })
    levaStore.setSettingsAtPath(panelPaths.stubSaveObject, { disabled })
    levaStore.setSettingsAtPath(panelPaths.stubAddLibrary, { disabled })
}

export function setStubDisabled(disabled: boolean = true) {
    levaStore.disableInputAtPath(panelPaths.stubPos, disabled)
    levaStore.disableInputAtPath(panelPaths.stubRot, disabled)
    levaStore.disableInputAtPath(panelPaths.stubScale, disabled)
    setButtonsDisabled(disabled)
}
export const enableStub = () => setStubDisabled(false)
export const disableStub = () => setStubDisabled(true)

export const disableRootStub = () => setStubDisabled(true)

export function setStubLeafDisabled(disabled: boolean = true) {
    levaStore.disableInputAtPath(panelPaths.stubPos, disabled)
    levaStore.disableInputAtPath(panelPaths.stubRot, true)
    levaStore.disableInputAtPath(panelPaths.stubScale, true)
    setButtonsDisabled(disabled)
}
export const disableLeafStub = () => setStubLeafDisabled(true)

export function enableNodeStub(isRoot: boolean) {
    if (isRoot) {
        setStubDisabled(false)
    } else {
        setStubLeafDisabled(false)
    }
}

export function setLevaInsertDefault() {
    const sync = {} as any
    sync[panelPaths.insert] = "..."
    levaStore.set(sync, false)
}

export function syncLevaInsertOptions(_options: Record<string, unknown>) {
    const path = panelPaths.insert
    const options = {
        "...": "...",
        ..._options,
    }
    const keys = Object.keys(options)
    const values = Object.values(options)
    levaStore.setSettingsAtPath(path, {
        keys,
        values,
    })
    // console.log(levaStore)
    // console.log(levaStore.getData()["Insert"])
}

const levaPosition = {
    x: 0,
    z: 0,
}
const levaRotation = {
    x: 0,
    y: 0,
}
const levaScale = {
    x: 1,
}

export const levaState = {
    levaPosition,
    levaRotation,
    levaScale,
}

const defaultValues = {
    levaPosition: { ...levaPosition },
    levaRotation: { ...levaRotation },
    levaScale: { ...levaScale },
}

export type PanelSettings = {
    position: THREE.Vector3 | { x: number; z: number }
    rotation: THREE.Vector3 | { x: number; y: number }
    scale: number
    usePosition: boolean
    useRotation: boolean
    useScale: boolean
    useButtons: boolean
}

export function updatePanel({
    position,
    rotation,
    scale,
    usePosition,
    useRotation,
    useScale,
    useButtons,
}: PanelSettings) {
    let positionValue = { ...defaultValues.levaPosition }
    let rotateValue = { ...defaultValues.levaRotation }
    let scaleValue = defaultValues.levaScale.x

    if (usePosition) {
        positionValue.x = position.x
        positionValue.z = position.z
    }

    if (useRotation) {
        rotateValue.x = rotation.x
        rotateValue.y = rotation.y
    }

    if (useScale) {
        scaleValue = scale
    }

    syncLevaDisplayStub({
        positionValue,
        rotateValue,
        scaleValue,
    })

    levaStore.disableInputAtPath(panelPaths.stubPos, !usePosition)
    levaStore.disableInputAtPath(panelPaths.stubRot, !useRotation)
    levaStore.disableInputAtPath(panelPaths.stubScale, !useScale)
    setButtonsDisabled(!useButtons)
}
