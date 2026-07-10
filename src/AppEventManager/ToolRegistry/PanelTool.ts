import * as THREE from "three"
import { Tool } from "./Tool"
import { moveDeltaSelectedNodes } from "../../App/controls/interaction"

type levaPosition = {
    x: number
    z: number
}

export class PanelTool extends Tool {
    private hit = new THREE.Vector3()
    private delta = new THREE.Vector3()
    private prevHit = new THREE.Vector3()

    onMoveStart(pos: levaPosition) {
        console.log("PanelTool.onMoveStart")
        this.prevHit.x = pos.x
        this.prevHit.y = 0
        this.prevHit.z = pos.z
		console.log(this.prevHit)
    }

    onMove(pos: levaPosition) {
        console.log("PanelTool.onMove")
        this.hit.x = pos.x
        this.hit.y = 0
        this.hit.z = pos.z
        this.delta.subVectors(this.hit, this.prevHit)
        console.log("delta")
        console.log(this.delta)
        if (this.ctx.selection.size > 1) {
            moveDeltaSelectedNodes(this.delta)
            this.ctx.selection.averagePosition.add(this.delta)
        } else {
            const selectedObject = this.ctx.selection.first()
            if (!selectedObject) return
            selectedObject.gizmoListener(this.hit)
            this.ctx.selection.averagePosition.copy(selectedObject.getCenter())
        }

        this.prevHit.copy(this.hit)
        this.linkGizmo()
    }

    // onRotateStart
    // onRotateF
    // onSccaleStartthe
    // onSccale
}
