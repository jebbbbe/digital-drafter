import * as THREE from "three"
import type { AppContext } from "../../App/AppContext"
import { deSelectAll } from "../../App/controls/interaction"
import { moveNodeToPosition } from "../../App/controls/move"
import type { SegmentAttachment, TransformNode } from "@types"
import type { AppEventManager } from "../AppEventManager"
import { Tool, type NormalizedPointerEvent } from "./Tool"
import {
    moveDeltaSelectedNodes,
} from "../../App/controls/interaction"
import { constrainDirection } from "./constrain"

export class MoveNodeTool extends Tool {
    private node?: TransformNode
    private readonly prevHit = new THREE.Vector3()
    private readonly candidatePosition = new THREE.Vector3()
    private readonly delta = new THREE.Vector3()
    private readonly lineDirection = new THREE.Vector3()
    private parentPosition?: THREE.Vector3

    override enter(node: TransformNode, startHit: THREE.Vector3): void {
        this.node = node
        this.prevHit.copy(startHit)
        this.lineDirection.set(0, 0, 0)

        const hasParentConstraint = this.node.parent !== this.node
        this.parentPosition = hasParentConstraint
            ? this.node.parent.position.clone()
            : undefined
        if (hasParentConstraint) {
            this.lineDirection.subVectors(
                this.node.position,
                this.node.parent.position
            )
        }

        this.ctx.controllers.pauseControls()
    }

    override onPointerMove(event: NormalizedPointerEvent) {
        if (!this.node) return

        const hit = this.ctx.raycastHelper.castFromEventToPlane(event.event)
        if (!hit) return

        this.delta.subVectors(hit, this.prevHit)
        if (this.delta.lengthSq() === 0) return

        this.candidatePosition.copy(this.node.position).add(this.delta)

        const parentPosition = this.parentPosition
        const constrainMove = event.event.shiftKey && parentPosition

        if (constrainMove) {
            constrainDirection(this.candidatePosition, this.lineDirection, parentPosition)
        }

        this.prevHit.copy(hit)

        moveNodeToPosition(this.node, this.candidatePosition)

        this.ctx.selection.averagePosition.copy(this.node.position)
        this.linkGizmo()
        this.linkPanel()
    }

    override onPointerUp() {
        this.cancel()
        this.eventManager.setTool("select")
    }

    override onPointerCancel() {
        this.cancel()
        this.eventManager.setTool("select")
    }

    override onKeyDown(event: KeyboardEvent): boolean {
        if (event.key !== "Escape") return false

        deSelectAll()
        this.cancel()
        this.eventManager.setTool("select")
        return true
    }

    override cancel(): void {
        this.ctx.controllers.resumeControls()
        this.node = undefined
        this.parentPosition = undefined
    }
}

export class MoveSegmentTool extends Tool {
    private line?: SegmentAttachment
    private readonly prevHit = new THREE.Vector3()
    private readonly delta = new THREE.Vector3()
    private readonly segmentLineDirection = new THREE.Vector3()
    private readonly segmentMidPoint = new THREE.Vector3()
    private readonly sectionCutter: AppContext["drafter"]["sectionCutter"]
    private sectionChild?: TransformNode
    private sectionParent?: TransformNode

    constructor(ctx: AppContext) {
        super(ctx)
        this.sectionCutter = this.ctx.drafter.sectionCutter
    }

    override enter(line: SegmentAttachment, startHit: THREE.Vector3): void {
        this.line = line
        this.prevHit.copy(startHit)
        this.sectionChild = undefined
        this.sectionParent = undefined
        this.segmentLineDirection.set(0, 0, 0)

        this.sectionChild = this.sectionCutter.nodeMap.get(this.line.index)
        if (this.sectionChild === undefined) {
            return
        }

        this.sectionParent = this.sectionChild.parent
        if (this.sectionParent === undefined) {
            return
        }

        this.segmentLineDirection.subVectors(
            this.sectionChild.position,
            this.sectionParent.position
        )
        this.ctx.controllers.pauseControls()
    }

    override onPointerMove(event: NormalizedPointerEvent) {
        if (!this.line) return

        const hit = this.ctx.raycastHelper.castFromEventToPlane(event.event)
        if (!hit) return

        this.delta.subVectors(hit, this.prevHit)
        if (this.delta.lengthSq() === 0) return

        constrainDirection(this.delta, this.segmentLineDirection)
        if (this.delta.lengthSq() === 0) return

        this.sectionCutter.moveSegmentVector(
            this.delta,
            this.delta,
            this.line.index
        )

        const [a, b] = this.ctx.drafter.sectionCutter.getSegmentAsVector(
            this.line.index
        )
        this.ctx.drafter.updatePatchedNode(this.sectionChild!)
        this.segmentMidPoint.addVectors(a, b).multiplyScalar(0.5)
        this.prevHit.copy(hit)

        this.ctx.selection.averagePosition.add(this.delta)
        this.linkGizmo()
        this.linkPanel()
    }

    override onPointerUp() {
        this.cancel()
        this.eventManager.setTool("select")
    }

    override onPointerCancel() {
        this.cancel()
        this.eventManager.setTool("select")
    }

    override onKeyDown(event: KeyboardEvent): boolean {
        if (event.key !== "Escape") return false

        deSelectAll()

        this.cancel()
        this.eventManager.setTool("select")
        return true
    }

    override cancel(): void {
        this.ctx.controllers.resumeControls()
        this.line = undefined
    }
}

export class MoveSelectionTool extends Tool {
    private delta = new THREE.Vector3()
    private prevHit = new THREE.Vector3()

    override enter(startHit: THREE.Vector3) {
        this.prevHit.copy(startHit)
        this.ctx.controllers.pauseControls()
    }

    override onPointerMove(e: NormalizedPointerEvent) {
        const hit = this.ctx.raycastHelper.castFromEventToPlane(e.event)
        if (!hit) return
        this.delta.subVectors(hit, this.prevHit)
        if (this.delta.lengthSq() === 0) return

        moveDeltaSelectedNodes(this.delta)
        this.prevHit.copy(hit)
        this.ctx.selection.averagePosition.add(this.delta)

        this.linkGizmo()
        this.linkPanel()
    }

    override onPointerUp() {
        this.cancel()
        this.eventManager.setTool("select")
    }

    override onPointerCancel() {
        this.cancel()
        this.eventManager.setTool("select")
    }

    override cancel(): void {
        this.ctx.controllers.resumeControls()
    }
}
