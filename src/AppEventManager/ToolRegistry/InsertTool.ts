import * as THREE from "three"
import { Tool, type NormalizedPointerEvent } from "./Tool"
import type { AppContext } from "../../App/AppContext"
import type { TransformNode } from "../../App/draft/TransformNode"
import { moveNodeToPosition } from "../../App/controls/move"
import { getNodevalues } from "../../App/controls/nodes"
import * as levaStore from "../../components/Leva/LevaStore"
import { setActiveTool } from "../state"

const _hit = new THREE.Vector3()

export class InsertTool extends Tool {
    private node: TransformNode | undefined

    constructor(ctx: AppContext) {
        super(ctx)
    }

    override enter(): void {
        this.node = this.ctx.selection.firstNode()
        if (!this.node) {
            setActiveTool("select")
            return
        }

        this.ctx.controllers.pauseControls()

        const selected = this.ctx.selection.first()
        if (selected && this.ctx.controllers.useTransformControls) {
            selected.gizmoSetup()
            this.ctx.controllers.attachTransformProxy()
        }
    }

    override onPointerMove(e: NormalizedPointerEvent): boolean {
        if (!this.node) return false

        const hit = this.ctx.raycastHelper.castFromEventToPlane(e.event, _hit)
        if (!hit) return false

        moveNodeToPosition(this.node, hit)
        return true
    }

    override onPointerUp(): boolean {
        if (!this.node) return false

        levaStore.syncLevaDisplayStub(getNodevalues(this.node))
        levaStore.setLevaInsertDefault()
        this.ctx.controllers.resumeControls()
        this.node = undefined
        setActiveTool("select")

        return true
    }

    override cancel(): void {
        if (!this.node) return

        this.ctx.controllers.resumeControls()
        this.node = undefined
    }
}
