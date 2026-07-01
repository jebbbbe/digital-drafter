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
    stubMirror: "Selection.Mirror View",
    stubDetach: "Selection.Detach View",
    stubDetachChildren: "Selection.Detach Children",
    stubUnion: "Selection.Union View",
    stubDifference: "Selection.Difference View",
    stubIntersect: "Selection.Intersect View",
    stubSaveObject: "Selection.Save Object",
    stubAddLibrary: "Selection.Add Object to Library",
}

type DisplayTheme = {
    background: string
    materials?: Record<string, any>
    mesh?: Record<string, any>
    line?: Record<string, any>
    dash?: Record<string, any>
    projection?: Record<string, any>
    fold?: Record<string, any>
    sectionLine?: Record<string, any>
}

export function syncLevaDisplayControls(display: DisplayTheme): void {
    console.log({ levaStore })
    const source = (display.materials ?? display) as Required<
        NonNullable<DisplayTheme["materials"]>
    >
    levaStore.set(
        {
            [panelPaths.background]: display.background,
            [panelPaths.meshColor]: source.mesh.color,
            [panelPaths.meshVisible]: source.mesh.visible,
            [panelPaths.lineColor]: source.line.color,
            [panelPaths.lineVisible]: source.line.visible,
            [panelPaths.dashColor]: source.dash.color,
            [panelPaths.dashVisible]: source.dash.visible,
            [panelPaths.dashSize]: source.dash.dashSize,
            [panelPaths.gapSize]: source.dash.gapSize,
            [panelPaths.projectionColor]: source.projection.color,
            [panelPaths.projectionVisible]: source.projection.visible,
            [panelPaths.foldColor]: source.fold.color,
            [panelPaths.foldVisible]: source.fold.visible,
            [panelPaths.foldDistance]: source.fold.foldDistance,
            [panelPaths.foldSize]: source.fold.foldSize,
            [panelPaths.sectionColor]: source.sectionLine.color,
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
