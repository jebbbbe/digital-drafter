import type { AppContext } from "../App/AppContext"
import type { Tool, ToolId, NormalizedPointerEvent } from "./ToolRegistry"
import { ToolRegistry } from "./ToolRegistry"
import { handleKeyboardDown, handleKeyboardUp } from "../App/events/keyboard"

export class AppEventManager {
    ctx!: AppContext
    registry!: ToolRegistry
    private readonly pointerListenerOptions = { capture: true }
    private currentToolId: ToolId
    private currentTool: Tool

    constructor(
        ctx: AppContext,
        registry: ToolRegistry,
        initialToolId: ToolId
    ) {
        this.ctx = ctx
        this.registry = registry
        this.currentToolId = initialToolId

        this.currentTool = registry.get(initialToolId)
        this.currentTool.enter()

        window.addEventListener("pointerdown", this.onPointerDown)
        window.addEventListener("pointermove", this.onPointerMove)
        window.addEventListener("pointerup", this.onPointerUp)
        window.addEventListener("pointercancel", this.onPointerCancel)

        window.addEventListener("keydown", this.onKeyDown)
        window.addEventListener("keyup", this.onKeyUp)

        window.addEventListener("wheel", this.onWheel, { passive: false })

        window.addEventListener("dblclick", this.onDoubleClick)
    }

    setTool(id: ToolId) {
        if (id === this.currentToolId) return
        this.currentTool.cancel()
        this.currentToolId = id
        this.currentTool = this.registry.get(id)
        this.currentTool.enter()
    }

    normalizePointerEvent(e: PointerEvent): NormalizedPointerEvent {
        // convert to NDC
        const rect = this.ctx.renderer.domElement.getBoundingClientRect?.() ?? {
            left: 0,
            top: 0,
            width: innerWidth,
            height: innerHeight,
        }

        const pointer = { x: 0, y: 0 }
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
        return {
            event: e,
            screen: pointer,
            shift: e.shiftKey,
            alt: e.altKey,
        }
    }

    private onPointerDown = (event: PointerEvent) => {
        const normalized = this.normalizePointerEvent(event)
        this.currentTool.onPointerDown(normalized)
    }

    private onPointerMove = (event: PointerEvent) => {
        const normalized = this.normalizePointerEvent(event)
        this.currentTool.onPointerMove(normalized)
    }

    private onPointerUp = (event: PointerEvent) => {
        const normalized = this.normalizePointerEvent(event)
        this.currentTool.onPointerUp(normalized)
    }

    private onPointerCancel = (event: PointerEvent) => {
        const normalized = this.normalizePointerEvent(event)
        this.currentTool.onPointerCancel(normalized)
    }

    private onWheel = (event: WheelEvent) => {
        this.currentTool.onWheel(event)
    }

    private onDoubleClick = (event: MouseEvent) => {
        this.currentTool.onDoubleClick(event)
    }

    private onKeyDown = (event: KeyboardEvent) => {
        //
        // Global shortcuts
        //

        // if (event.key === "Escape") {
        //     this.currentTool.cancel()
        //     return
        // }

        // if ((event.ctrlKey || event.metaKey) && event.key === "z") {
        //     console.log("Undo")
        //     return
        // }

        //
        // Tool shortcuts
        //

        const override = this.currentTool.onKeyDown(event)
        if (override) return
        // pass to default key events
        handleKeyboardDown(event)
    }

    private onKeyUp = (event: KeyboardEvent) => {
        const override = this.currentTool.onKeyUp(event)
        if (override) return
        // pass to default key events
        handleKeyboardUp(event)
    }
}
