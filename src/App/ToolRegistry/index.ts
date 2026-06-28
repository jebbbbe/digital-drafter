import type { AppContext } from "../AppContext"
export { MoveTool } from "./MoveTool"
export { SelectTool } from "./SelectTool"

export type NormalizedPointerEvent = {
    event: PointerEvent
    screen: { x: number; y: number }
    shift: boolean
    alt: boolean
}

export type ToolId = "select" | "move"

export class ToolRegistry {
    private tools = new Map<ToolId, Tool>()

    register(id: ToolId, tool: Tool): void {
        this.tools.set(id, tool)
    }

    get(id: ToolId): Tool {
        const tool = this.tools.get(id)

        if (!tool) {
            throw new Error(`Tool not registered: ${id}`)
        }

        return tool
    }
}

export abstract class Tool {
    ctx!: AppContext
    constructor(ctx: AppContext) {
        this.ctx = ctx
    }
    enter(): void {}

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
}

export abstract class Interaction {
    constructor(ctx: AppContext) {}

    start(_event: NormalizedPointerEvent): void {}

    cancel(): void {}

    onPointerMove(_event: NormalizedPointerEvent): boolean {
        return false
    }

    onPointerUp(_event: NormalizedPointerEvent): boolean {
        return true
    }

    onPointerCancel(_event: NormalizedPointerEvent): boolean {
        this.cancel()
        return true
    }

    onKeyDown(_event: KeyboardEvent): boolean {
        return false
    }
    onKeyUp(_event: KeyboardEvent): boolean {
        return false
    }
}

export abstract class InteractiveTool extends Tool {
    protected interaction: Interaction | null = null

    override cancel(): void {
        this.interaction?.cancel()
        this.interaction = null
    }

    override onPointerMove(event: NormalizedPointerEvent): boolean {
        return this.interaction?.onPointerMove(event) ?? false
    }

    override onPointerUp(event: NormalizedPointerEvent): boolean {
        if (!this.interaction) return false

        const handled = this.interaction.onPointerUp(event)
        this.interaction = null

        return handled
    }

    override onPointerCancel(event: NormalizedPointerEvent): boolean {
        if (!this.interaction) return false

        const handled = this.interaction.onPointerCancel(event)
        this.interaction = null

        return handled
    }

    override onKeyDown(event: KeyboardEvent): boolean {
        return this.interaction?.onKeyDown(event) ?? false
    }

    override onKeyUp(event: KeyboardEvent): boolean {
        return this.interaction?.onKeyUp(event) ?? false
    }

    protected startInteraction(
        interaction: Interaction,
        event: NormalizedPointerEvent
    ): void {
        this.cancel()
        this.interaction = interaction
        this.interaction.start(event)
    }
}
