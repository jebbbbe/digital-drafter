import * as THREE from "three"
import * as rand from "../utils/random"
import {
    panelPaths,
    setLevaControlDisabled,
} from "../../components/Leva/LevaStore"

import type { TransformNode } from "../draft/TransformNode"
import { isAppReady, drafter } from "../main"

// updates by category
export * from "./display.ts"
export * from "./camera.ts"
export * from "./export.ts"
export * from "./debug.ts"
// main update funcitons:

const _matrixPosition = new THREE.Vector3()
const _matrixQuaternion = new THREE.Quaternion()
const _matrixScale = new THREE.Vector3()

function setMatrixUniformScale(matrix: THREE.Matrix4, value: number): void {
    matrix.decompose(_matrixPosition, _matrixQuaternion, _matrixScale)
    _matrixScale.set(value, value, value)
    matrix.compose(_matrixPosition, _matrixQuaternion, _matrixScale)
}

export function addTestNode(x: number = 10, z: number = 5): void {
    if (!isAppReady) return
    const instance = drafter.instanceItems[0]
    if (!instance) return
    const max = instance.count - 1
    drafter.addLeafNode(
        {
            position: new THREE.Vector3(
                rand.random(-x, x),
                0,
                rand.random(-z, z)
            ),
        },
        { id: 0, index: rand.randomInt(0, max) }
    )
}

export function setRootScaleMatrix(value: number): void {
    if (!isAppReady) return

    const instanceItem = drafter.instanceItems[0]
    const rootNode = drafter.tree.findNode({ id: 0, index: 0 }) as
        | TransformNode
        | undefined
    if (!instanceItem || !rootNode) return

    setMatrixUniformScale(instanceItem.localTransform, value)

    rootNode.compoundMatrix.copy(instanceItem.localTransform)
    drafter.updatePatchedNode(rootNode)
}
