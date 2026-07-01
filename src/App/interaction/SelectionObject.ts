import * as THREE from "three"
import type { Mesh } from "three"
import type { TransformNode } from "../draft/TransformNode"
import { getSlotIndex } from "../objects/textures/GlobalTreeTexture"
import {
    pruneNode,
    detachNode,
    detachNodeChildren,
} from "../controls/nodes"
import { deleteSegment } from "../controls/section"
import { drafter, controllers } from "../AppContext"
import {
    setupSegmentGizmo,
    moveNodeToPosition,
    moveSegmentToPosition,
} from "../controls/move"

import { deSelectAll } from "../controls/interaction"

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

    abstract setSelected(isSelected: boolean): void

    detach() {}

    detachChildren() {}

    mirror() {}
}

export class NodeSelectionObject extends SelectionObject<TransformNode> {
    get kind(): Exclude<SelectType, "SectionSegment"> {
        if (this.target.sectionChild) return "sectionChild"
        if (this.target.sectionParent) return "sectionParent"
        if (this.target.type === "root") return "root"
        return "leaf"
    }

    move(_startHit: THREE.Vector3) {
        return undefined
    }

    gizmoSetup() {
        const node = this.target
        controllers.setGizmoTranslate()
        controllers.cachedAnchorOffset.set(0, 0, 0)

        const anchor = drafter.getNodesAnchoredCenter(node)
        controllers.setAnchorCache(node.position, anchor)
        controllers.setGizmoPosition(node.position)
    }

    gizmoListener() {
        moveNodeToPosition(this.target, controllers.getGizmoPosition())
    }

    delete() {
        deSelectAll()
        pruneNode(this.target)
    }

    setSelected(isSelected: boolean) {
        const slot = getSlotIndex(this.target.location)
        drafter.globalTreeTexture.writeNodeSelected(slot, isSelected)
        drafter.globalTreeTexture.sendUpdate(slot)
    }

    detach() {
        detachNode(this.target)
    }

    detachChildren() {
        detachNodeChildren(this.target)
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

    move(_startHit: THREE.Vector3) {
        return undefined
    }

    gizmoSetup() {
        setupSegmentGizmo(this.target)
    }

    gizmoListener() {
        moveSegmentToPosition(this.target, controllers.getGizmoPosition())
    }

    delete() {
        deSelectAll()
        deleteSegment(this.target)
    }

    setSelected(isSelected: boolean) {
        console.warn("not implemented Select for ", this)
    }
}

export type SelectObject = NodeSelectionObject | SegmentSelectionObject
