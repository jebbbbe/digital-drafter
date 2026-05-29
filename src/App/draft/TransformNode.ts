import * as THREE from "three"
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

type TransformData = {
    position: THREE.Vector3
    baseMatrix: THREE.Matrix4
    compoundMatrix: THREE.Matrix4
    type: TransformType
}

export type TransformNode = Node<TransformData>

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
    })

    if (node.parent !== undefined && node.parent !== newNode) {
        node.parent.children.push(newNode)
    }

    return newNode
}
