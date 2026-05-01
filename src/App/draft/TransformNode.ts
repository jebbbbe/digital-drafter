import * as THREE from "three"
import type { Node } from "./TransformTree"

type TransformData = {
    position: THREE.Vector3
    baseMatrix: THREE.Matrix4
    compoundMatrix: THREE.Matrix4
    localMatrix: THREE.Matrix4
}

export type TransformNode = Node<TransformData>

export function createTransformNode(
    node: Partial<TransformNode> = {}
): TransformNode {
    const newNode = {} as TransformNode

    Object.assign(newNode, {
        position: node.position ?? new THREE.Vector3(),
        baseMatrix: node.baseMatrix ?? new THREE.Matrix4(),
        compoundMatrix: node.compoundMatrix ?? new THREE.Matrix4(),
        localMatrix: node.localMatrix ?? new THREE.Matrix4(),
        instanceLookup: {
            id: -1,
            index: -1,
            ...node.instanceLookup,
        },
        parent: node.parent ?? newNode,
        children: node.children ?? [],
    })

    if (node.parent !== undefined) {
        node.parent.children.push(newNode)
    }

    return newNode
}
