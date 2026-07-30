import * as THREE from "three"
import { Tool, type NormalizedPointerEvent } from "./Tool"
import * as levaStore from "../../components/Leva/LevaStore"
import { moveAbsoluteSelectedNodes } from "../../App/controls/interaction"
import { constrainDirection } from "./constrain"

type AttachedMoveConstraint = {
    origin: THREE.Vector3
    direction: THREE.Vector3
}

type AttachedMoveEnterArgs = [
    done?: (success: boolean) => void,
    constraint?: AttachedMoveConstraint,
]

export class AttachedMoveTool extends Tool {
    private constraint?: AttachedMoveConstraint

    override enter(...args: unknown[]): void {
        const [done, constraint] = args as AttachedMoveEnterArgs
        this.resolve = done
        this.constraint = constraint

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

        if (this.constraint) {
            constrainDirection(
                hit,
                this.constraint.direction,
                this.constraint.origin,
                0
            )
        }

        const delta = new THREE.Vector3().subVectors(
            hit,
            this.ctx.selection.averagePosition
        )
        if (delta.lengthSq() === 0) return

        moveAbsoluteSelectedNodes(hit)

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
        this.constraint = undefined
        levaStore.setLevaInsertDefault()
        this.ctx.controllers.resumeControls()
        this.resolveTool(false)
    }
}
