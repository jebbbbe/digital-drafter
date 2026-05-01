import * as THREE from "three"
import type { Node } from "./TransformTree"

type TransformData = {
    position: THREE.Vector3
    baseMatrix: THREE.Matrix4
    compoundMatrix: THREE.Matrix4
    localMatrix: THREE.Matrix4
}

export type TransformNode = Node<TransformData>

export function createTransformNode({
    pos,
    mat,
    id,
    parent,
}: {
    pos?: THREE.Vector3
    mat?: THREE.Matrix4
    id?: number
    parent?: TransformNode
} = {}): TransformNode {
    const node = {} as TransformNode

    Object.assign(node, {
        position: pos ?? new THREE.Vector3(),
        baseMatrix: mat ?? new THREE.Matrix4(),
        compoundMatrix: new THREE.Matrix4(),
        localMatrix: new THREE.Matrix4(),
        instanceLookup: {
            id: id ?? -1,
            index: -1,
        },
        parent: parent ?? node,
        children: [],
    })

    if (parent !== undefined) {
        parent.children.push(node)
    }

    return node
}
