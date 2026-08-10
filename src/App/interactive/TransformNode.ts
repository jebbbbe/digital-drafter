import * as THREE from "three"
import type { Node } from "../draft/TransformTree"
import { InteractiveObject } from "./InteractiveObject"
import { drafter, controllers } from "../AppContext"
import type {
    GizmoSettings,
    PanelSettings,
    SectionAttachment,
    SegmentAttachment,
    NodeLocation,
} from "@types"
import { getLevaArgs } from "../controls/nodes"
import { updatePanel } from "../../components/Leva/LevaStore"
import { moveNodeToPosition } from "../controls/move"
import { getSlotIndex } from "../objects/textures/GlobalTreeTexture"

const _quaternion = new THREE.Quaternion()

type TransformType = "root" | "leaf"
type NodeAttachments = {
    segment?: SegmentAttachment
    section?: SectionAttachment
}
type TransformData = {
    position: THREE.Vector3
    baseMatrix: THREE.Matrix4
    compoundMatrix: THREE.Matrix4
    type: TransformType
    mirror: boolean
    sectionChild: boolean
    sectionParent: boolean
    attachments: NodeAttachments
}

export class TransformNode
    extends InteractiveObject
    implements Node<TransformData>
{
    position: THREE.Vector3
    baseMatrix: THREE.Matrix4
    compoundMatrix: THREE.Matrix4
    location: NodeLocation
    parent: TransformNode
    children: TransformNode[]
    type: TransformType
    mirror: boolean
    sectionChild: boolean
    sectionParent: boolean
    attachments: NodeAttachments

    constructor(node: Partial<TransformNode> = {}) {
        super()

        this.parent = node.parent ?? this
        this.type = node.parent === this ? "root" : (node.type ?? "leaf")
        this.position = node.position ?? new THREE.Vector3()
        this.baseMatrix = node.baseMatrix ?? new THREE.Matrix4()
        this.compoundMatrix = node.compoundMatrix ?? new THREE.Matrix4()
        this.location = {
            id: -1,
            index: -1,
            ...node.location,
        }
        this.children = node.children ?? []
        this.mirror = node.mirror ?? false
        this.sectionChild = node.sectionChild ?? false
        this.sectionParent = node.sectionParent ?? false
        this.attachments = node.attachments ?? {}

        if (node.parent !== undefined && node.parent !== this) {
            node.parent.children.push(this)
        }
    }

    override move(_startHit: THREE.Vector3) {
        return undefined
    }

    override getCenter() {
        return this.position
    }

    override gizmoSetup(settings: Partial<GizmoSettings>) {
        const defaultGizmo: GizmoSettings = {
            anchor: drafter.getNodesAnchoredCenter(this),
            center: this.position,
            quaternion: _quaternion,
            preset: "translate",
        }
        settings = { ...defaultGizmo, ...settings }
        controllers.setGizmoSettings(settings as GizmoSettings)
    }

    override panelSetup(settings: Partial<PanelSettings>) {
        const defaultPanel = getLevaArgs(this)
        settings = { ...defaultPanel, ...settings }
        updatePanel(settings as PanelSettings)
    }

    override gizmoListener(position = controllers.getGizmoPosition()) {
        moveNodeToPosition(this, position)
    }

    override delete() {
        // drafter.spliceNode(this)
        // drafter.removeBranch(this)
        drafter.removeNode(this)
    }

    override setSelected(isSelected: boolean) {
        this.selected = isSelected

        const slot = getSlotIndex(this.location)
        drafter.globalTreeTexture.writeNodeSelected(slot, isSelected)
        drafter.globalTreeTexture.sendUpdate(slot)

        //section
        const SectionAttachment = this.attachments?.section
        if (SectionAttachment) {
            SectionAttachment.setSelected(isSelected)
        }

        // line
        const segment = this.attachments?.segment
        if (segment) {
            segment.setSelected(isSelected)
        }
    }

    mirrorNode(recursive: boolean = true) {
        this.mirror = !this.mirror
        if (recursive) drafter.updatePatchedNode(this)
    }

    detachNode() {
        this.removeCutAttachments()
        drafter.detachNode(this)
    }

    detachChildren() {
        const children = [...this.children]
        children.forEach((child) => {
            child.detachNode()
        })
    }

    detachAll() {
        this.detachNode()
        this.detachChildren()
    }

    removeCutAttachments() {
        const segmentAttachment = this.attachments.segment
        if (segmentAttachment !== undefined) {
            this.attachments.segment = undefined
            drafter.sectionCutter.deleteSegment(segmentAttachment.index)
        }
        const faceAttachment = this.attachments.section
        if (faceAttachment !== undefined) {
            this.attachments.section = undefined
            faceAttachment.delete()
        }
        this.sectionChild = false
    }
}

export function createTransformNode(
    node: Partial<TransformNode> = {}
): TransformNode {
    return new TransformNode(node)
}
