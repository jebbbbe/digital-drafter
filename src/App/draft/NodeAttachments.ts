import type { Object3D } from "three"
import type { TransformNode } from "./TransformNode"
import type { SectionCutter } from "../objects/meshes/SectionCutter"

export type AttachmentKind = "section" | "segment" | "intersection" | "label"

export type BaseAttachment = {
    kind: AttachmentKind
}

export type SegmentAttachment = BaseAttachment & {
    kind: "segment"
    object: SectionCutter
    index: number
}

export type SectionAttachment = BaseAttachment & {
    kind: "section"
    object: Object3D
}

export type IntersectionAttachment = BaseAttachment & {
    kind: "intersection"
    intersections: TransformNode[]
}

// unsued
// export type LabelAttachment = BaseAttachment & {
//     kind: "label"
//     string: string
// }

export type NodeAttachment =
    | SegmentAttachment
    | SectionAttachment
    | IntersectionAttachment

type AttachmentOfKind<Kind extends AttachmentKind> = Extract<
    NodeAttachment,
    { kind: Kind }
>

/**
 * Node object references stay stable even when packed tree indices change
 * allows easy lookkup of a nodes attached geometries
 * find: sectionlines, Secction Geometry, Intersections, Text Tags
 */
export class NodeAttachments {
    private attachments = new WeakMap<TransformNode, NodeAttachment[]>()

    add(node: TransformNode, attachment: NodeAttachment): NodeAttachment {
        const attachments = this.attachments.get(node)
        if (attachments) {
            attachments.push(attachment)
            return attachment
        }

        this.attachments.set(node, [attachment])
        return attachment
    }

    get(node: TransformNode): readonly NodeAttachment[] {
        return this.attachments.get(node) ?? []
    }

    getByKind<Kind extends AttachmentKind>(
        node: TransformNode,
        kind: Kind
    ): AttachmentOfKind<Kind>[] {
        const attachments = this.attachments.get(node)
        if (!attachments) return []

        return attachments.filter(
            (attachment): attachment is AttachmentOfKind<Kind> =>
                attachment.kind === kind
        )
    }

    has(node: TransformNode, attachment: NodeAttachment): boolean {
        return this.attachments.get(node)?.includes(attachment) ?? false
    }

    remove(node: TransformNode, attachment: NodeAttachment): boolean {
        const attachments = this.attachments.get(node)
        if (!attachments) return false

        const index = attachments.indexOf(attachment)
        if (index === -1) return false

        attachments.splice(index, 1)
        if (attachments.length === 0) {
            this.attachments.delete(node)
        }
        return true
    }

    removeByKind<Kind extends AttachmentKind>(
        node: TransformNode,
        kind: Kind
    ): AttachmentOfKind<Kind>[] {
        const attachments = this.attachments.get(node)
        if (!attachments) return []

        const removed = this.getByKind(node, kind)
        if (removed.length === 0) return []

        const kept = attachments.filter(
            (attachment) => attachment.kind !== kind
        )

        if (kept.length === 0) {
            this.attachments.delete(node)
        } else {
            this.attachments.set(node, kept)
        }

        return removed
    }

    clearNode(node: TransformNode): NodeAttachment[] {
        const attachments = this.attachments.get(node)
        if (!attachments) return []

        this.attachments.delete(node)
        return attachments
    }

    forEach(
        node: TransformNode,
        visit: (attachment: NodeAttachment, index: number) => void
    ): void {
        const attachments = this.attachments.get(node)
        if (!attachments) return

        for (let i = 0; i < attachments.length; i++) {
            visit(attachments[i], i)
        }
    }
}

export function createSegmentAttachment(
    object: SectionCutter,
    index: number
): SegmentAttachment {
    return {
        kind: "segment",
        object,
        index,
    }
}

export function createSectionAttachment(object: Object3D): SectionAttachment {
    return {
        kind: "section",
        object,
    }
}
