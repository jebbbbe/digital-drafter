import * as THREE from "three"
import type { AppContext } from "../../App/AppContext"
import { deSelectAll } from "../../App/controls/interaction"
import { moveNodeToPosition } from "../../App/controls/move"
import type { TransformNode } from "../../App/objects/attachments"
import type { SegmentAttachment } from "../../App/objects/attachments"
import type { AppEventManager } from "../AppEventManager"
import { Tool, type NormalizedPointerEvent } from "./Tool"
import { moveDeltaSelectedNodes } from "../../App/controls/interaction"

export class MoveNodeTool extends Tool {
    private node?: TransformNode
    private readonly prevHit = new THREE.Vector3()
    private readonly candidatePosition = new THREE.Vector3()
    private readonly delta = new THREE.Vector3()
    private readonly lineDirection = new THREE.Vector3()
    private readonly parentToCandidate = new THREE.Vector3()
    private parentPosition?: THREE.Vector3
    private lineLengthSq = 0

    constructor(ctx: AppContext, eventManager: AppEventManager) {
        super(ctx, eventManager)
    }

    override enter(node: TransformNode, startHit: THREE.Vector3): void {
        this.node = node
        this.prevHit.copy(startHit)
        this.lineDirection.set(0, 0, 0)
        this.parentToCandidate.set(0, 0, 0)

        const hasParentConstraint = this.node.parent !== this.node
        this.parentPosition = hasParentConstraint
            ? this.node.parent.position.clone()
            : undefined
        this.lineLengthSq = hasParentConstraint
            ? this.lineDirection
                  .subVectors(this.node.position, this.node.parent.position)
                  .lengthSq()
            : 0

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
        const constrainMove =
            event.event.shiftKey && parentPosition && this.lineLengthSq > 0

        if (constrainMove) {
            const t = this.parentToCandidate
                .subVectors(this.candidatePosition, parentPosition)
                .dot(this.lineDirection)

            this.candidatePosition
                .copy(parentPosition)
                .addScaledVector(this.lineDirection, t / this.lineLengthSq)
        }

        this.prevHit.copy(hit)

        moveNodeToPosition(this.node, this.candidatePosition)

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
    private lineLengthSq = 0

    constructor(ctx: AppContext, eventManager: AppEventManager) {
        super(ctx, eventManager)
        this.sectionCutter = this.ctx.drafter.sectionCutter
    }

    override enter(line: SegmentAttachment, startHit: THREE.Vector3): void {
        this.line = line
        this.prevHit.copy(startHit)
        this.sectionChild = undefined
        this.sectionParent = undefined
        this.segmentLineDirection.set(0, 0, 0)
        this.lineLengthSq = 0

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
        this.lineLengthSq = this.segmentLineDirection.lengthSq()
        this.ctx.controllers.pauseControls()
    }

    override onPointerMove(event: NormalizedPointerEvent) {
        if (this.lineLengthSq === 0 || !this.line) return

        const hit = this.ctx.raycastHelper.castFromEventToPlane(event.event)
        if (!hit) return

        this.delta.subVectors(hit, this.prevHit)
        if (this.delta.lengthSq() === 0) return

        const deltaAlongLine =
            this.delta.dot(this.segmentLineDirection) / this.lineLengthSq
        this.delta
            .copy(this.segmentLineDirection)
            .multiplyScalar(deltaAlongLine)
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

    constructor(ctx: AppContext, eventManager: AppEventManager) {
        super(ctx, eventManager)
    }

    override enter(startHit: THREE.Vector3) {
        this.prevHit.copy(startHit)
        this.ctx.controllers.pauseControls()
    }

    override onPointerMove(e: NormalizedPointerEvent) {
        const hit = this.ctx.raycastHelper.castFromEventToPlane(e.event)
        if (!hit) return
        this.delta.subVectors(hit, this.prevHit)

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
