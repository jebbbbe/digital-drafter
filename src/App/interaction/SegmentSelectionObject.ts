import { SelectionObject } from "./SelectionObject"
import * as THREE from "three"
import type { Mesh } from "three"
import { deleteSegment } from "../controls/section"
import { drafter, controllers } from "../AppContext"
import { setupSegmentGizmo, moveSegmentToPosition } from "../controls/move"
import { deSelectAll } from "../controls/interaction"

export type SectionSegment = {
    object: Mesh
    index: number
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
