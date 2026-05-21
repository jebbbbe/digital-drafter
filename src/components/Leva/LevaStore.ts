import { levaStore } from "leva"

export const panelPaths = {
    insert: "Insert",
    theme: "Settings.theme",
    background: "Settings.Display.Background",
    meshColor: "Settings.Display.Mesh.meshColor",
    meshVisible: "Settings.Display.Mesh.meshVisible",
    lineColor: "Settings.Display.Line.lineColor",
    lineVisible: "Settings.Display.Line.lineVisible",
    dashColor: "Settings.Display.Dash.dashColor",
    dashVisible: "Settings.Display.Dash.dashVisible",
    dashSize: "Settings.Display.Dash.dashSize",
    gapSize: "Settings.Display.Dash.gapSize",
    projectionColor: "Settings.Display.Projection.projectionColor",
    projectionVisible: "Settings.Display.Projection.projectionVisible",
    foldColor: "Settings.Display.Fold.foldColor",
    foldVisible: "Settings.Display.Fold.foldVisible",
    foldDistance: "Settings.Display.Fold.foldDistance",
    foldSize: "Settings.Display.Fold.foldSize",
    sectionColor: "Settings.Display.Section.sectionColor",

    stubPos: "Selection.position",
    stubRot: "Selection.rotate",
    stubScale: "Selection.scale",
    stubButton: "Selection.buttonGroup", // not able to disable..?

    stubAdd: "Selection.Add View",
    stubDelete: "Selection.Delete View",
    stubCut: "Selection.Section Cut",
}

type DisplayTheme = {
    background: string
    mesh: {
        color: string
        visible: boolean
    }
    line: {
        color: string
        visible: boolean
    }
    dash: {
        color: string
        visible: boolean
        dashSize: number
        gapSize: number
    }
    projection: {
        color: string
        visible: boolean
    }
    fold: {
        color: string
        visible: boolean
        foldDistance: number
        foldSize: number
    }
    section: {
        color: string
    }
}

export function syncLevaDisplayControls(display: DisplayTheme): void {
    console.log({ levaStore })
    levaStore.set(
        {
            [panelPaths.background]: display.background,
            [panelPaths.meshColor]: display.mesh.color,
            [panelPaths.meshVisible]: display.mesh.visible,
            [panelPaths.lineColor]: display.line.color,
            [panelPaths.lineVisible]: display.line.visible,
            [panelPaths.dashColor]: display.dash.color,
            [panelPaths.dashVisible]: display.dash.visible,
            [panelPaths.dashSize]: display.dash.dashSize,
            [panelPaths.gapSize]: display.dash.gapSize,
            [panelPaths.projectionColor]: display.projection.color,
            [panelPaths.projectionVisible]: display.projection.visible,
            [panelPaths.foldColor]: display.fold.color,
            [panelPaths.foldVisible]: display.fold.visible,
            [panelPaths.foldDistance]: display.fold.foldDistance,
            [panelPaths.foldSize]: display.fold.foldSize,
            [panelPaths.sectionColor]: display.section.color,
        },
        false
    )
}

export function syncLevaDisplayStub({
    positionValue,
    rotateValue,
    scaleValue,
    // }: NodeValues): void {
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
export function setStubDisabled(disabled: boolean = true) {
    levaStore.disableInputAtPath(panelPaths.stubPos, disabled)
    levaStore.disableInputAtPath(panelPaths.stubRot, disabled)
    levaStore.disableInputAtPath(panelPaths.stubScale, disabled)
    // levaStore.setSettingsAtPath(panelPaths.stubButton, { disabled })
    levaStore.setSettingsAtPath(panelPaths.stubAdd, { disabled })
    levaStore.setSettingsAtPath(panelPaths.stubDelete, { disabled })
    levaStore.setSettingsAtPath(panelPaths.stubCut, { disabled })
}
export const enableStub = () => setStubDisabled(false)
export const disableStub = () => setStubDisabled(true)

export const enableRootStub = () => setStubDisabled(false)
export const disableRootStub = () => setStubDisabled(true)

export function setStubLeafDisabled(disabled: boolean = true) {
    levaStore.disableInputAtPath(panelPaths.stubPos, disabled)
    levaStore.disableInputAtPath(panelPaths.stubRot, true)
    levaStore.disableInputAtPath(panelPaths.stubScale, true)
    // levaStore.setSettingsAtPath(panelPaths.stubButton, { disabled })
    levaStore.setSettingsAtPath(panelPaths.stubAdd, { disabled })
    levaStore.setSettingsAtPath(panelPaths.stubDelete, { disabled })
    levaStore.setSettingsAtPath(panelPaths.stubCut, { disabled })
}
export const enableLeafStub = () => setStubLeafDisabled(false)
export const disableLeafStub = () => setStubLeafDisabled(true)

export function setLevaInsertDefault() {
    const sync = {} as any
    sync[panelPaths.insert] = "..."
    levaStore.set(sync, false)
}
