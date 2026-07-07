import type { AppContext } from "../../App/AppContext"
import type { AppEventManager } from "../AppEventManager"

export type NormalizedPointerEvent = {
    event: PointerEvent
    screen: { x: number; y: number }
    shift: boolean
    alt: boolean
    ctrl: boolean
}

export abstract class Tool {
    protected ctx: AppContext
    protected eventManager: AppEventManager
    constructor(ctx: AppContext, eventManager: AppEventManager) {
        this.ctx = ctx
        this.eventManager = eventManager
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

    linkGizmo() {
        const { selection } = this.ctx
        console.log("linkGizmo")
        // console.log(selection)
    }
    linkPanel() {
        const { selection } = this.ctx
        console.log("linkPanel")
        // console.log(selection)
    }
}
