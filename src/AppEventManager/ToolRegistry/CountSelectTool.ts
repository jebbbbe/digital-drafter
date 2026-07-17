import { Tool, type NormalizedPointerEvent } from "./Tool"
import { deSelectAll } from "../../App/controls/interaction"

type SelectNodesEnterArgs = [
    done?: (success: boolean) => void,
    targetCount?: number,
]

export class CountSelectTool extends Tool {
    private targetCount = 0

    override enter(...args: unknown[]): void {
        const [resolve, targetCount = 0] = args as SelectNodesEnterArgs
        this.targetCount = targetCount
        this.resolve = resolve
        this.ctx.controllers.detachTransformControls()
        this.ctx.controllers.pauseControls()

        if (
            this.ctx.selection.filter("TransformNode").length >=
            this.targetCount
        ) {
            this.resolveTool(true)
            this.eventManager.setTool("disable")
        }
    }

    override onPointerUp(_normalized: NormalizedPointerEvent) {
        const e = _normalized.event
        const { drafter, raycastHelper, selection } = this.ctx

        if (e.pointerType === "touch" && !e.isPrimary) return

        const intersects = raycastHelper.castFromEvent(e)
        if (intersects.length === 0) {
            return
        }

        const first = intersects[0]
        const id = first.object.userData.id
        const index = first.instanceId
        if (id === undefined || index === undefined) {
            return
        }

        const node = drafter.findNode({ id, index })
        if (!node) return

        let removed = false
        let added = false

        if (e.ctrlKey) {
            removed = selection.remove(node)
        } else {
            added = selection.add(node)
        }

        if (
            !removed &&
            selection.filter("TransformNode").length >= this.targetCount
        ) {
            this.resolveTool(true)
            this.eventManager.setTool("disable")
        }
    }

    override onPointerCancel() {
        deSelectAll()
        this.resolveTool(false)
        this.eventManager.setTool("disable")
    }

    override onKeyDown(event: KeyboardEvent): boolean {
        if (event.key === "Enter") {
            this.resolveTool(true)
            this.eventManager.setTool("disable")
            return true
        }

        if (event.key !== "Escape") return false

        deSelectAll()
        this.resolveTool(false)
        this.eventManager.setTool("disable")
        return true
    }

    cancel(): void {
        this.targetCount = 0
        this.ctx.controllers.resumeControls()
        this.resolveTool(false)
    }
}
