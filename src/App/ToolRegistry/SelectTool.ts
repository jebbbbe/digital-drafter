import { Tool, type NormalizedPointerEvent } from "./index"

export class SelectTool extends Tool {
    private dragging = false

    override onPointerDown(e: NormalizedPointerEvent): boolean {
        this.dragging = true

        console.log("Start Move", e.event.clientX, e.event.clientY)

        return true
    }

    override onPointerMove(e: NormalizedPointerEvent): boolean {
        if (!this.dragging) {
            return false
        }

        console.log("Dragging", e.event.clientX, e.event.clientY)

        return true
    }

    override onPointerUp(): boolean {
        if (!this.dragging) {
            return false
        }

        this.dragging = false

        console.log("Finish Move")

        return true
    }

    override cancel(): void {
        if (!this.dragging) {
            return
        }

        console.log("Move cancelled")

        this.dragging = false
    }
}
