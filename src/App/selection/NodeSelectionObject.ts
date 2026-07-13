import { SelectionObject, type SelectType } from "./SelectionObject"
import * as THREE from "three"
import type { TransformNode } from "../objects/attachments"
import type { GizmoSettings } from "./ThreeControllersManager"
import type { PanelSettings } from "../../components/Leva/LevaStore"
import { getSlotIndex } from "../objects/textures/GlobalTreeTexture"
import { pruneNode, getLevaArgs } from "../controls/nodes"
import { drafter, controllers } from "../AppContext"
import { moveNodeToPosition } from "../controls/move"
import { deSelectAll } from "../controls/interaction"
import { updatePanel } from "../../components/Leva/LevaStore"

const _quaternion = new THREE.Quaternion()

export class NodeSelectionObject extends SelectionObject<TransformNode> {
    get kind(): Exclude<SelectType, "SectionSegment"> {
        if (this.target.sectionChild) return "sectionChild"
        if (this.target.sectionParent) return "sectionParent"
        if (this.target.type === "root") return "root"
        return "leaf"
    }

    override move(_startHit: THREE.Vector3) {
        return undefined
    }

    override getCenter() {
        return this.target.position
    }

    override gizmoSetup(settings: Partial<GizmoSettings>) {
        const node = this.target
        const defaultGizmo: GizmoSettings = {
            anchor: drafter.getNodesAnchoredCenter(node),
            center: node.position,
            quaternion: _quaternion,
            preset: "translate",
        }
        settings = { ...defaultGizmo, ...settings }
        controllers.setGizmoSettings(settings as GizmoSettings)
    }

    override panelSetup(settings: Partial<PanelSettings>) {
        const node = this.target
        const defaultPanel = getLevaArgs(node)
        settings = { ...defaultPanel, ...settings }
        updatePanel(settings as PanelSettings)
    }

    override gizmoListener(position = controllers.getGizmoPosition()) {
        moveNodeToPosition(this.target, position)
    }

    override delete() {
        deSelectAll()
        pruneNode(this.target)
    }

    override setSelected(isSelected: boolean) {
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
