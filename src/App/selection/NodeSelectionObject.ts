import { SelectionObject, type SelectType } from "./SelectionObject"
import * as THREE from "three"
import type { TransformNode } from "../draft/TransformNode"
import { getSlotIndex } from "../objects/textures/GlobalTreeTexture"
import { pruneNode } from "../controls/nodes"
import { drafter, controllers } from "../AppContext"
import { moveNodeToPosition } from "../controls/move"
import { deSelectAll } from "../controls/interaction"

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

        const SectionFaceGroup = this.target.attachments?.section?.object
        if (SectionFaceGroup) {
            SectionFaceGroup.edges.material = isSelected
                ? SectionFaceGroup.selectedMaterial
                : SectionFaceGroup.defaultMaterial
        }
    }
}
