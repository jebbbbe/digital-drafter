import {
    Interaction,
    InteractiveTool,
    type NormalizedPointerEvent,
} from "./Tool"
import type { AppContext } from "../../App/AppContext"
import {
    SegmentSelectionObject,
    NodeSelectionObject,
} from "../../App/selection"
import * as THREE from "three"
import type { TransformNode } from "../../App/draft/TransformNode"
import type { NodeLocation } from "../../App/draft/TransformTree"
import type { SectionSegment } from "../../App/selection"
import { deSelectAll } from "../../App/controls/interaction"
import { getNodevalues } from "../../App/controls/nodes"
import { moveNodeToPosition } from "../../App/controls/move"
import * as levaStore from "../../components/Leva/LevaStore"

import type { GizmoSettings } from "../../App/selection/ThreeControllersManager"
import type { PanelSettings } from "../../components/Leva/LevaStore"

const startHit = new THREE.Vector3()

const _zeroVec3 = new THREE.Vector3()
const _zeroQuaternion = new THREE.Quaternion()

abstract class InteractionMode extends Interaction {
    protected finished = false

    protected finish(): void {
        this.finished = true
    }
}

class NodeMoveInteractionMode extends InteractionMode {
    private readonly node: TransformNode
    private readonly prevHit = new THREE.Vector3().copy(startHit)
    private readonly candidatePosition = new THREE.Vector3()
    private readonly delta = new THREE.Vector3()
    private readonly lineDirection = new THREE.Vector3()
    private readonly parentToCandidate = new THREE.Vector3()
    private readonly parentPosition?: THREE.Vector3
    private readonly lineLengthSq: number

    constructor(ctx: AppContext, node: TransformNode) {
        super(ctx)
        this.node = node

        // levaStore.syncLevaDisplayStub(getNodevalues(node))
        // levaStore.enableNodeStub(node.parent === node)

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

    override onPointerMove(event: NormalizedPointerEvent): boolean {
        if (this.finished) return false

        const hit = this.ctx.raycastHelper.castFromEventToPlane(event.event)
        if (!hit) return false

        this.delta.subVectors(hit, this.prevHit)
        if (this.delta.lengthSq() === 0) return false

        this.candidatePosition.copy(this.node.position).add(this.delta)

        const constrainMove =
            event.event.shiftKey && this.parentPosition && this.lineLengthSq > 0

        if (constrainMove) {
            const t = this.parentToCandidate
                .subVectors(this.candidatePosition, this.parentPosition)
                .dot(this.lineDirection)

            this.candidatePosition
                .copy(this.parentPosition)
                .addScaledVector(this.lineDirection, t / this.lineLengthSq)
        }

        this.prevHit.copy(hit)

        const anchor = this.ctx.drafter.getNodesAnchoredCenter(this.node)
        this.ctx.controllers.setAnchorCache(anchor)

        moveNodeToPosition(this.node, this.candidatePosition)

        this.linkGizmo()
        this.linkPanel()

        return true
    }

    override onPointerUp(): boolean {
        if (this.finished) return false

        this.finish()
        levaStore.syncLevaDisplayStub(getNodevalues(this.node))
        this.ctx.controllers.resumeControls()
        return true
    }

    override cancel(): void {
        if (this.finished) return

        this.finish()
        this.ctx.controllers.resumeControls()
    }
}

class SegmentMoveInteractionMode extends InteractionMode {
    private readonly line: SectionSegment
    private readonly prevHit = new THREE.Vector3().copy(startHit)
    private readonly delta = new THREE.Vector3()
    private readonly segmentLineDirection = new THREE.Vector3()
    private readonly segmentMidPoint = new THREE.Vector3()
    private readonly sectionCutter: AppContext["drafter"]["sectionCutter"]
    private readonly sectionChild?: TransformNode
    private readonly sectionParent?: TransformNode
    private readonly lineLengthSq: number

    constructor(ctx: AppContext, line: SectionSegment) {
        super(ctx)
        this.line = line
        this.sectionCutter = this.ctx.drafter.sectionCutter

        this.sectionChild = this.sectionCutter.nodeMap.get(this.line.index)
        if (this.sectionChild === undefined) {
            this.lineLengthSq = 0
            return
        }

        this.sectionParent = this.sectionChild.parent
        if (this.sectionParent === undefined) {
            this.lineLengthSq = 0
            return
        }

        this.segmentLineDirection.subVectors(
            this.sectionChild.position,
            this.sectionParent.position
        )
        this.lineLengthSq = this.segmentLineDirection.lengthSq()
        this.ctx.controllers.pauseControls()
    }

    override onPointerMove(event: NormalizedPointerEvent): boolean {
        if (this.finished || this.lineLengthSq === 0) return false

        const hit = this.ctx.raycastHelper.castFromEventToPlane(event.event)
        if (!hit) return false

        this.delta.subVectors(hit, this.prevHit)
        if (this.delta.lengthSq() === 0) return false

        const deltaAlongLine =
            this.delta.dot(this.segmentLineDirection) / this.lineLengthSq
        this.delta
            .copy(this.segmentLineDirection)
            .multiplyScalar(deltaAlongLine)
        if (this.delta.lengthSq() === 0) return false

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
        this.ctx.controllers.updateGizmoPosition(this.segmentMidPoint)

        this.prevHit.copy(hit)
        return true
    }

    override onPointerUp(): boolean {
        if (this.finished) return false

        this.finish()
        this.ctx.controllers.resumeControls()
        return true
    }

    override cancel(): void {
        if (this.finished) return

        this.finish()
        this.ctx.controllers.resumeControls()
    }
}

export class SelectTool extends InteractiveTool {
    override onPointerDown(normalized: NormalizedPointerEvent) {
        const e = normalized.event
        const { drafter, raycastHelper, selection, controllers } = this.ctx

        // exit early for multiple touchs on mobile
        if (e.pointerType === "touch" && !e.isPrimary) return

        // if we clicked the gizmo, exit early so we can use it
        if (this.gizmoClicked(e)) return

        //raycast to interactive objects in the scene
        const intersects = raycastHelper.castFromEvent(e)

        // nothing hit!
        if (intersects.length === 0) {
            if (!e.shiftKey && !e.ctrlKey) {
                deSelectAll()
            }

            return
        }

        const first = intersects[0]

        const hit = raycastHelper.castFromEventToPlane(e, startHit)
        if (!hit) return

        //clear seleciton
        if (!e.shiftKey && !e.ctrlKey) {
            selection.clear()
        }

        // create selectedObject from type
        let selectedObject: NodeSelectionObject | SegmentSelectionObject
        if (first.object === drafter.sectionCutter.mesh) {
            // hit section cutter
            const { index, faceIndex, object }: any = intersects[0]
            selectedObject = new SegmentSelectionObject({
                object,
                // for gl_line or LineMaterial
                index: index ?? faceIndex * 2,
            })
        } else {
            // find node from raycast
            const id = first.object.userData.id
            const index = first.instanceId
            const location = { id, index }

            // add node to selection
            const node = drafter.findNode(location as NodeLocation)
            if (!node) return

            selectedObject = new NodeSelectionObject(node)
        }
        console.log({ selectedObject })

        if (e.ctrlKey) {
            selection.remove(selectedObject)
            return
        } else {
            selection.add(selectedObject)
        }

        if (controllers.useTransformControls) {
            const gizmoSettings: Partial<GizmoSettings> = {
                center: selection.averagePosition,
            }

            if (selection.map.size > 1) {
                gizmoSettings.anchor = _zeroVec3
                gizmoSettings.quaternion = _zeroQuaternion
                gizmoSettings.preset = "translate"
            } else {
                controllers.attachTransformProxy()
            }
            selectedObject.gizmoSetup(gizmoSettings)
        }
        const panelSettings: Partial<PanelSettings> = {
            position: selection.averagePosition,
        }

        if (selection.map.size > 1) {
            panelSettings.usePosition = true
            panelSettings.useRotation = false
            panelSettings.useScale = false
            panelSettings.useButtons = true
        }
        selectedObject.panelSetup(panelSettings)

        this.cancel()

        if (selectedObject instanceof NodeSelectionObject) {
            this.startInteraction(
                new NodeMoveInteractionMode(this.ctx, selectedObject.target),
                normalized
            )
        } else if (selectedObject instanceof SegmentSelectionObject) {
            this.startInteraction(
                new SegmentMoveInteractionMode(this.ctx, selectedObject.target),
                normalized
            )
        }
    }

    gizmoClicked(e: PointerEvent): boolean {
        const { controllers, selection, raycastHelper } = this.ctx
        if (controllers.useTransformControls && selection.map.size > 0) {
            const gizmoHits = raycastHelper.castFromEvent(
                e,
                [controllers.transformControls.getHelper()],
                true
            )
            if (gizmoHits.length > 0 && controllers.transformControls.axis) {
                return true
            }
        }
        return false
    }

    override onKeyDown(event: KeyboardEvent): boolean {
        if (event.key !== "Escape" || !this.interaction) return false

        this.cancel()
        deSelectAll()
        return true
    }
}
