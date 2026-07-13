import * as THREE from "three"
import type { SectionCutter, SectionFaceGroup } from "../objects/attachments"
import type { Node } from "./TransformTree"
import { InteractiveObject } from "../selection/SelectionObject"

/*
relationship between parent and child nodes,
which update fns to use
*/
export type TransformType =
    | "root" // no relationship, root node
    | "leaf" // standard
    //
    // | "mirror" // mirrored output
    // | "slide" // pos constrained
    // requires pos offset matrix
    | "intersect" // boolean logic
// low priotiy  requires aditonal args
// | "arc" // rotated on page
// | "scale" // scale object larger.
// | "perspecctive" // do a perspecctive camera transform on node?

// / refrences to extranal geometries for specific nodes
export type NodeAttachments = {
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
    location: Node<TransformData>["location"]
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
}
export type SegmentAttachment = {
    object: SectionCutter
    index: number
}

export type SectionAttachment = {
    object: SectionFaceGroup
}

export type IntersectionAttachment = {
    intersections: TransformNode[]
}

export function createSegmentAttachment(
    object: SectionCutter,
    index: number
): SegmentAttachment {
    return {
        object,
        index,
    }
}

export function createSectionAttachment(
    object: SectionFaceGroup
): SectionAttachment {
    return {
        object,
    }
}

export function createTransformNode(
    node: Partial<TransformNode> = {}
): TransformNode {
	return new TransformNode(node)
}