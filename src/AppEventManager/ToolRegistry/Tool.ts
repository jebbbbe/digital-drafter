import * as THREE from "three"
import type { AppContext } from "../../App/AppContext"
import type { AppEventManager } from "../AppEventManager"
import type { GizmoSettings, PanelSettings } from "@types"
import { updatePanel } from "../../components/Leva/LevaStore"

export type NormalizedPointerEvent = {
    event: PointerEvent
    screen: { x: number; y: number }
    shift: boolean
    alt: boolean
    ctrl: boolean
}

const _zeroVec3 = new THREE.Vector3()
const _zeroQuaternion = new THREE.Quaternion()

export abstract class Tool {
    protected ctx: AppContext
    protected eventManager: AppEventManager
    protected resolve?: (success: boolean) => void

    constructor(ctx: AppContext) {
        this.ctx = ctx
        this.eventManager = ctx.eventManager
    }
    enter(..._args: unknown[]): void {}

    exit(): void {
        this.cancel()
    }

    cancel(): void {}
    onGizmoMove(event: NormalizedPointerEvent): void {}
    onPointerDown(event: NormalizedPointerEvent): void {}
    onPointerMove(event: NormalizedPointerEvent): void {}
    onPointerUp(event: NormalizedPointerEvent): void {}
    onPointerEnter(event: NormalizedPointerEvent): void {}
    onPointerLeave(event: NormalizedPointerEvent): void {}
    onPointerCancel(event: NormalizedPointerEvent): void {}
    onDoubleClick(event: MouseEvent): void {}
    onWheel(event: WheelEvent): boolean {
        return false
    }
    onKeyDown(event: KeyboardEvent): boolean {
        return false
    }
    onKeyUp(event: KeyboardEvent): boolean {
        return false
    }

    protected resolveTool(success: boolean): boolean {
        const resolve = this.resolve
        if (!resolve) return false

        this.resolve = undefined
        resolve(success)
        return true
    }

    linkGizmo() {
        const { selection, controllers } = this.ctx

        const gizmoSettings: Partial<GizmoSettings> = {
            center: selection.averagePosition,
        }

        if (selection.size <= 1) {
            const selectedObject = selection.first()
            selectedObject.gizmoSetup(gizmoSettings)
        } else {
            gizmoSettings.anchor = _zeroVec3
            gizmoSettings.quaternion = _zeroQuaternion
            gizmoSettings.preset = "translate"
            controllers.setGizmoSettings(gizmoSettings as GizmoSettings)
        }
    }
    linkPanel() {
        const { selection } = this.ctx

        const panelSettings: Partial<PanelSettings> = {
            position: selection.averagePosition,
        }
        if (selection.size <= 1) {
            const selectedObject = selection.first()
            selectedObject.panelSetup(panelSettings)
        } else {
            panelSettings.usePosition = true
            panelSettings.useRotation = false
            panelSettings.useScale = false
            panelSettings.useButtons = true
            updatePanel(panelSettings as PanelSettings)
        }
    }
}
