import * as THREE from "three"
import { Tool } from "./Tool"
import { moveDeltaSelectedNodes } from "../../App/controls/interaction"

export class TransformTool extends Tool {
    private delta = new THREE.Vector3()
    private prevHit = new THREE.Vector3()
    onTransfromStart() {
        this.prevHit.copy(this.ctx.controllers.getGizmoPosition())
    }

    onTransform() {
        let hit = this.ctx.controllers.getGizmoPosition()
        this.delta.subVectors(hit, this.prevHit)

        if (this.ctx.selection.size > 1) {
            moveDeltaSelectedNodes(this.delta)
        } else {
            const selectedObject = this.ctx.selection.first()
            selectedObject.gizmoListener()
        }

        this.prevHit.copy(hit)
        this.ctx.selection.averagePosition.add(this.delta)
        this.linkPanel()
    }
}



