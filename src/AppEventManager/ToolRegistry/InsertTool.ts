import * as THREE from "three"
import { Tool, type NormalizedPointerEvent } from "./Tool"
import * as levaStore from "../../components/Leva/LevaStore"
import { moveAbsoluteSelectedNodes } from "../../App/controls/interaction"

export class InsertTool extends Tool {
    private resolve?: () => void
    private reject?: () => void

    override enter(resolve = undefined, reject = undefined): void {
        if (this.ctx.selection.size === 0) {
            this.eventManager.setTool("select")
            return
        }
        this.ctx.controllers.pauseControls()
        this.ctx.controllers.attachTransformProxy()
        this.linkGizmo()
        this.linkPanel()

        this.resolve = resolve
        this.reject = reject
    }

    override onPointerMove(e: NormalizedPointerEvent) {
        const hit = this.ctx.raycastHelper.castFromEventToPlane(e.event)
        if (!hit) return
        console.log(hit)
        const delta = moveAbsoluteSelectedNodes(hit)
        this.ctx.selection.averagePosition.add(delta)
        this.linkPanel()
    }

    override onPointerUp() {
        this.linkGizmo()
        this.linkPanel()
        levaStore.setLevaInsertDefault() //sets ui dropdown to default
        this.ctx.controllers.resumeControls()

        console.log(this.resolve)
        console.log(this.resolve !== undefined)

        if (this.resolve !== undefined) {
            this.finish()
        } else {
            this.eventManager.setTool("select")
        }
    }

    override cancel() {
        if (!this.resolve) return

        this.ctx.controllers.resumeControls()
        this.resolve = undefined
        this.reject?.()
        this.reject = undefined
    }

    private finish() {
        if (!this.resolve) return

        const resolve = this.resolve
        this.ctx.controllers.resumeControls()
        this.resolve = undefined
        this.reject = undefined

        resolve?.()
    }
}
