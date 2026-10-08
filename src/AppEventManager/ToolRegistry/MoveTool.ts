import * as THREE from "three"
import type { InteractiveObject } from "@types"
import { deSelectAll } from "../../App/controls/interaction"
import { Tool, type NormalizedPointerEvent } from "./Tool"
import { constrainDirection } from "./constrain"

class MoveBaseTool extends Tool {
    protected readonly prevHit = new THREE.Vector3()
    protected readonly delta = new THREE.Vector3()

    override onPointerUp() {
        this.eventManager.setTool("select")
    }

    override onPointerCancel() {
        this.eventManager.setTool("select")
    }

    override onKeyDown(event: KeyboardEvent): boolean {
        if (event.key !== "Escape") return false
        deSelectAll()
        this.eventManager.setTool("select")
        return true
    }

    override cancel() {
        this.ctx.controllers.resumeControls()
    }
}

export class MoveTool extends MoveBaseTool {
    private object?: InteractiveObject
    private readonly direction = new THREE.Vector3()
    private readonly origin = new THREE.Vector3()
    private readonly position = new THREE.Vector3()

    override enter(object: InteractiveObject, startHit: THREE.Vector3) {
        this.object = object
        this.prevHit.copy(startHit)
        this.origin.copy(object.getCenter())
        this.direction.copy(object.getConstraintDirection())
        this.ctx.controllers.pauseControls()
    }

    override onPointerMove(event: NormalizedPointerEvent) {
        const object = this.object
        if (!object) return
        const hit = this.ctx.raycastHelper.castFromEventToPlane(event.event)
        if (!hit) return
        this.delta.subVectors(hit, this.prevHit)
        if (this.delta.lengthSq() === 0) return
        this.prevHit.copy(hit)

        this.position.copy(object.getCenter()).add(this.delta)
        if (
            object.defaultConstraint === "direction" ||
            (event.event.shiftKey && this.direction.lengthSq() > 0)
        ) {
            constrainDirection(this.position, this.direction, this.origin)
        }
        object.setPosition(this.position)
        this.ctx.selection.averagePosition.copy(object.getCenter())
        this.linkGizmo()
        this.linkPanel()
    }

    override cancel() {
        super.cancel()
        this.object = undefined
    }
}

export class MoveSelectionTool extends MoveBaseTool {
    override enter(startHit: THREE.Vector3) {
        if (this.ctx.selection.size <= 1) return
        this.prevHit.copy(startHit)
        this.ctx.controllers.pauseControls()
    }

    override onPointerMove(event: NormalizedPointerEvent) {
        const { selection } = this.ctx
        if (selection.size <= 1) return
        const hit = this.ctx.raycastHelper.castFromEventToPlane(event.event)
        if (!hit) return
        this.delta.subVectors(hit, this.prevHit)
        if (this.delta.lengthSq() === 0) return

        this.moveSelection(this.delta)
        this.prevHit.copy(hit)
        selection.averagePosition.add(this.delta)
        this.linkGizmo()
        this.linkPanel()
    }
}
