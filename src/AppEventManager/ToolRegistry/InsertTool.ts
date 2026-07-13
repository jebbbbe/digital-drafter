import * as THREE from "three"
import { Tool, type NormalizedPointerEvent } from "./Tool"
import type { TransformNode } from "../../App/objects/attachments"
import { moveNodeToPosition } from "../../App/controls/move"
import { getNodevalues } from "../../App/controls/nodes"
import * as levaStore from "../../components/Leva/LevaStore"

const _hit = new THREE.Vector3()
const _delta = new THREE.Vector3()

export class InsertTool extends Tool {
    private node: TransformNode | undefined

    override enter(): void {
        this.node = this.ctx.selection.firstNode()
        if (!this.node) {
            this.eventManager.setTool("select")
            return
        }
        this.ctx.controllers.pauseControls()
        this.ctx.controllers.attachTransformProxy()
        this.linkGizmo()
        this.linkPanel()
    }

    override onPointerMove(e: NormalizedPointerEvent) {
        if (!this.node) return

        const hit = this.ctx.raycastHelper.castFromEventToPlane(e.event, _hit)
        if (!hit) return

        _delta.subVectors(hit, this.node.position)

        moveNodeToPosition(this.node, hit)

        this.ctx.selection.averagePosition.add(_delta)
        this.linkGizmo()
        this.linkPanel()
    }

    override onPointerUp() {
        if (!this.node) return

        levaStore.setLevaInsertDefault()
        this.ctx.controllers.resumeControls()
        this.node = undefined
        this.eventManager.setTool("select")
    }

    override cancel() {
        if (!this.node) return

        this.ctx.controllers.resumeControls()
        this.node = undefined
    }
}
