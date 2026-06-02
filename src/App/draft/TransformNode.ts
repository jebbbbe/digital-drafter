import * as THREE from "three"
import type { Object3D } from "three"
import type { SectionCutter } from "../objects/meshes/SectionCutter"
import type { Node } from "./TransformTree"

/*
relationship between parent and child nodes,
which update fns to use
*/
export type TransformType =
    | "root" // no relationship, root node
    | "rotate" // standard
    //
    | "mirror" // mirrored output
    | "slide" // pos constrained
    // requires pos offset matrix
    | "intersect" // boolean logic
    // low priotiy  requires aditonal args
    // | "arc" // rotated on page
    // | "scale" // scale object larger.
    // | "perspecctive" // do a perspecctive camera transform on node?
    | "sectionChild" // section cut
    | "sectionParent" // section cut

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
    attachments: NodeAttachments
}

export type TransformNode = Node<TransformData>
export type SegmentAttachment = {
    object: SectionCutter
    index: number
}

export type SectionAttachment = {
    object: Object3D
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

export function createSectionAttachment(object: Object3D): SectionAttachment {
    return {
        object,
    }
}

export function createTransformNode(
    node: Partial<TransformNode> = {}
): TransformNode {
    const newNode = {} as TransformNode
    const parent = node.parent ?? newNode
    const type = node.parent === newNode ? "root" : (node.type ?? "rotate")

    Object.assign(newNode, {
        position: node.position ?? new THREE.Vector3(),
        baseMatrix: node.baseMatrix ?? new THREE.Matrix4(),
        compoundMatrix: node.compoundMatrix ?? new THREE.Matrix4(),
        location: {
            id: -1,
            index: -1,
            ...node.location,
        },
        parent,
        children: node.children ?? [],
        type,
        mirror: node.mirror ?? false,
        attachments: node.attachments ?? {},
    })

    if (node.parent !== undefined && node.parent !== newNode) {
        node.parent.children.push(newNode)
    }

    return newNode
}
