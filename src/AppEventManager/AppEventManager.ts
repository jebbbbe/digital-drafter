import type { AppContext } from "../App/AppContext"
import type { Tool, NormalizedPointerEvent } from "./ToolRegistry"
import { handleKeyboardDown, handleKeyboardUp } from "./ToolRegistry/keyboard"
import type { ToolId } from "@types"

export class AppEventManager {
    ctx!: AppContext
    private tools = new Map<ToolId, Tool>()
    private currentToolId!: ToolId
    private currentTool!: Tool
    asyncToolActive: boolean = false
    constructor() {}

    setContext(ctx: AppContext, initialToolId: ToolId) {
        this.ctx = ctx
        this.currentToolId = initialToolId

        this.currentTool = this.get(initialToolId)
        this.currentTool.enter()

        const renderElement = this.ctx.renderer.domElement
        renderElement.addEventListener("pointerdown", this.onPointerDown)
        renderElement.addEventListener("pointermove", this.onPointerMove)
        renderElement.addEventListener("pointerup", this.onPointerUp)
        renderElement.addEventListener("pointercancel", this.onPointerCancel)

        window.addEventListener("keydown", this.onKeyDown)
        window.addEventListener("keyup", this.onKeyUp)

        window.addEventListener("wheel", this.onWheel, { passive: false })
        window.addEventListener("dblclick", this.onDoubleClick)
    }

    register(id: ToolId, tool: Tool): void {
        this.tools.set(id, tool)
    }

    private get(id: ToolId): Tool {
        const tool = this.tools.get(id)

        if (!tool) {
            throw new Error(`Tool not registered: ${id}`)
        }

        return tool
    }

    dispose() {
        const renderElement = this.ctx.renderer.domElement
        renderElement.removeEventListener("pointerdown", this.onPointerDown)
        renderElement.removeEventListener("pointermove", this.onPointerMove)
        renderElement.removeEventListener("pointerup", this.onPointerUp)
        renderElement.removeEventListener("pointercancel", this.onPointerCancel)
        window.removeEventListener("keydown", this.onKeyDown)
        window.removeEventListener("keyup", this.onKeyUp)
        window.removeEventListener("wheel", this.onWheel)
        window.removeEventListener("dblclick", this.onDoubleClick)
        this.currentTool.cancel()
    }

    setTool(id: ToolId, ...args: unknown[]) {
        this.currentTool.cancel()
        this.currentToolId = id
        this.currentTool = this.get(id)
        this.currentTool.enter(...args)
    }

    setToolAsync(tool: ToolId, ...args: unknown[]) {
		this.asyncToolActive = true
        return new Promise<boolean>((resolve) => {
            this.setTool(tool, resolve, ...args)
        })
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
            ctrl: e.ctrlKey,
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
