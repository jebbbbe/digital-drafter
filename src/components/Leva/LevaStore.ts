import { levaStore } from "leva"

export const panelPaths = {
    scaleMatrix: "Debug.rootScale",
    test: "Display.Scene.Background",
    theme: "Display.theme",
    background: "Display.Scene.Background",
    meshColor: "Display.Scene.Mesh.meshColor",
    meshVisible: "Display.Scene.Mesh.meshVisible",
    lineColor: "Display.Scene.Line.lineColor",
    lineVisible: "Display.Scene.Line.lineVisible",
    dashColor: "Display.Scene.Dash.dashColor",
    dashVisible: "Display.Scene.Dash.dashVisible",
    dashSize: "Display.Scene.Dash.dashSize",
    gapSize: "Display.Scene.Dash.gapSize",
    projectionColor: "Display.Scene.Projection.projectionColor",
    projectionVisible: "Display.Scene.Projection.projectionVisible",
    foldColor: "Display.Scene.Fold.foldColor",
    foldVisible: "Display.Scene.Fold.foldVisible",
    foldDistance: "Display.Scene.Fold.foldDistance",
    foldSize: "Display.Scene.Fold.foldSize",

    stubPos: "Stub.position",
    stubRot: "Stub.rotate",
    stubScale: "Stub.scale",
    stubButton: "Stub.buttonGroup", // not able to disable..?
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
    // levaStore.disableInputAtPath(panelPaths.stubButton, disabled)
}
export const enableStub = () => setStubDisabled(false)
export const disableStub = () => setStubDisabled(true)

export const enableRootStub = () => setStubDisabled(false)
export const disableRootStub = () => setStubDisabled(true)

export function setStubLeafDisabled(disabled: boolean = true) {
    levaStore.disableInputAtPath(panelPaths.stubPos, disabled)
    levaStore.disableInputAtPath(panelPaths.stubRot, true)
    levaStore.disableInputAtPath(panelPaths.stubScale, true)
    // levaStore.disableInputAtPath(panelPaths.stubButton, disabled)
}
export const enableLeafStub = () => setStubLeafDisabled(false)
export const disableLeafStub = () => setStubLeafDisabled(true)
