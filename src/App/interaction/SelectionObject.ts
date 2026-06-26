import * as THREE from "three"
import type { Mesh } from "three"
import type { TransformNode } from "../draft/TransformNode"
import { pruneNode, detachNode, getNodevalues } from "../controls/nodes"
import { deleteSegment } from "../controls/section"
import { drafter, interactionManager } from "../main"
import {
    attachSegmentMove,
    attachNodeMove,
    setupSegmentGizmo,
    moveNodeToPosition,
    moveSegmentToPosition,
} from "../controls/move"
import * as levaStore from "../../components/Leva/LevaStore"

export type SectionSegment = {
    object: Mesh
    index: number
}

export type SelectType =
    | "SectionSegment"
    | "leaf"
    | "root"
    | "sectionChild"
    | "sectionParent"

export abstract class SelectionObject<TTarget> {
    target: TTarget

    constructor(target: TTarget) {
        this.target = target
    }

    abstract get kind(): SelectType

    abstract move(startHit: THREE.Vector3): unknown

    abstract gizmoSetup(): void

    abstract gizmoListener(): void

    abstract delete(): void

    detach() {
        // console.warn("noop detach", this)
    }

    mirror() {
        // console.warn("noop mirror", this)s
    }
}

export class NodeSelectionObject extends SelectionObject<TransformNode> {
    get kind(): Exclude<SelectType, "SectionSegment"> {
        if (this.target.sectionChild) return "sectionChild"
        if (this.target.sectionParent) return "sectionParent"
        if (this.target.type === "root") return "root"
        return "leaf"
    }

    move(startHit: THREE.Vector3) {
        const node = this.target
        levaStore.syncLevaDisplayStub(getNodevalues(node))
        levaStore.enableNodeStub(node.parent === node)
        return attachNodeMove(node, startHit)
    }

    gizmoSetup() {
        const node = this.target
        interactionManager.controllers.setGizmoTranslate()
        interactionManager.controllers.cachedAnchorOffset.set(0, 0, 0)

        const anchor = drafter.getNodesAnchoredCenter(node)
        interactionManager.controllers.setAnchorCache(node.position, anchor)
        interactionManager.controllers.setGizmoPosition(node.position)
    }

    gizmoListener() {
        moveNodeToPosition(
            this.target,
            interactionManager.controllers.getGizmoPosition()
        )
    }

    delete() {
        interactionManager.deselectAll()
        pruneNode(this.target)
    }

    detach() {
        detachNode(this.target)
    }

    mirror() {
        const node = this.target
        node.mirror = !node.mirror
        drafter.updatePatchedNode(node)
    }
}

export class SegmentSelectionObject extends SelectionObject<SectionSegment> {
    get kind(): "SectionSegment" {
        return "SectionSegment"
    }

    move(startHit: THREE.Vector3) {
        return attachSegmentMove(this.target, startHit)
    }

    gizmoSetup() {
        setupSegmentGizmo(this.target)
    }

    gizmoListener() {
        moveSegmentToPosition(
            this.target,
            interactionManager.controllers.getGizmoPosition()
        )
    }

    delete() {
        deleteSegment(this.target)
    }
}

export type SelectObject = NodeSelectionObject | SegmentSelectionObject
