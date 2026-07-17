import * as THREE from "three"
import { Tool, type NormalizedPointerEvent } from "./Tool"
import * as levaStore from "../../components/Leva/LevaStore"
import { moveAbsoluteSelectedNodes } from "../../App/controls/interaction"

type AttachedMoveEnterArgs = [done?: (success: boolean) => void]

export class AttachedMoveTool extends Tool {
    override enter(...args: unknown[]): void {
        const [done] = args as AttachedMoveEnterArgs
        this.resolve = done

        if (this.ctx.selection.size === 0) {
            this.resolveTool(false)
            this.eventManager.setTool("disable")
            return
        }

        this.ctx.controllers.pauseControls()
        this.ctx.controllers.attachTransformProxy()
        this.linkGizmo()
        this.linkPanel()
    }

    override onPointerMove(e: NormalizedPointerEvent) {
        const hit = this.ctx.raycastHelper.castFromEventToPlane(e.event)
        if (!hit) return
        const delta = moveAbsoluteSelectedNodes(hit)
        this.ctx.selection.averagePosition.add(delta)
        this.linkPanel()
    }

    override onPointerUp() {
        this.linkGizmo()
        this.linkPanel()
        levaStore.setLevaInsertDefault()
        this.resolveTool(true)
        this.eventManager.setTool("disable")
    }

    override onPointerCancel() {
        this.resolveTool(false)
        this.eventManager.setTool("disable")
    }

    override onKeyDown(event: KeyboardEvent): boolean {
        if (event.key !== "Escape") return false

        this.resolveTool(false)
        this.eventManager.setTool("disable")
        return true
    }

    cancel() {
        levaStore.setLevaInsertDefault()
        this.ctx.controllers.resumeControls()
        this.resolveTool(false)
    }
}
