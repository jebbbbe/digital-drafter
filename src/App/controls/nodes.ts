import * as THREE from "three"
import * as rand from "../utils/random"
import { isAppReady, drafter, interactionManager } from "../main"
import type { TransformNode } from "../draft/TransformNode"

const PI = Math.PI
const PIo2 = PI / 2
const _matrixPosition = new THREE.Vector3()
const _matrixQuaternion = new THREE.Quaternion()
const _matrixScale = new THREE.Vector3()
const _posOffset = new THREE.Vector3()
const _rotateEuler = new THREE.Euler(0, 0, 0, "YXZ")

function setMatrixUniformScale(matrix: THREE.Matrix4, value: number): void {
    matrix.decompose(_matrixPosition, _matrixQuaternion, _matrixScale)
    _matrixScale.set(value, value, value)
    matrix.compose(_matrixPosition, _matrixQuaternion, _matrixScale)
}

export function addTestNode(x: number = 10, z: number = 5): void {
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

export function addLeafNearbyRandomlyFromSelection() {
    const selection = interactionManager.selection
    if (selection.length === 0) return
    const node = interactionManager.selection[0]
    if (!node) return
    addLeafNearbyRandomly(node)
}

export function addLeafNearbyRandomly(node: TransformNode) {
    const r = rand.randomItem([2, 4, 6])
    const t = rand.randomItem([
        0,
        PI / 4,
        PI / 2,
        (3 * PI) / 4,
        PI,
        (5 * PI) / 4,
        (3 * PI) / 2,
        (7 * PI) / 4,
    ])
    _posOffset.setFromSphericalCoords(r, PI / 2, t)
    const newNode = {
        position: new THREE.Vector3().addVectors(node.position, _posOffset),
    }
    drafter.addLeafNode(newNode, node.location)
}

export function addLeafNearbyRandomlyNicely(node: TransformNode) {
    const near = [node.position, node.parent.position]
    const children = node.children
    for (let i = 0; i < children.length; i++) {
        near.push(children[i].position)
    }
    const minDist = 2
    let dist = Infinity
    const rItems = [2, 4, 6] as const
    const tItems = [
        0,
        PI / 4,
        PI / 2,
        (3 * PI) / 4,
        PI,
        (5 * PI) / 4,
        (3 * PI) / 2,
        (7 * PI) / 4,
    ] as const
    let startRandom = rItems.length * tItems.length
    let cnt = 0
    while (dist > minDist) {
        let r, t
        if (cnt < startRandom) {
            r = rand.randomItem(rItems)
            t = rand.randomItem(tItems)
        } else {
            r = rand.random()
            t = rand.random()
        }
        _posOffset.setFromSphericalCoords(r, PIo2, t)

        let minDist = Infinity
        for (let i = 0; i < near.length; i++) {
            const d = _posOffset.distanceToSquared(near[i])
            minDist = Math.min(d, minDist)
        }
        dist = Math.sqrt(minDist)

        cnt++
    }
    const newNode = {
        position: new THREE.Vector3().addVectors(node.position, _posOffset),
    }
    drafter.addLeafNode(newNode, node.location)
}

export function pruneNodeFromSelection() {
    const selection = interactionManager.selection
    if (selection.length === 0) return
    const node = interactionManager.selection[0]
    if (!node) return
    pruneNode(node)
}

export function pruneNode(node: TransformNode) {
    drafter.pruneNode(node)
    interactionManager.onPruneNode()
}

export function rotateRootFromSelection(rot: { x: number; y: number }) {
    const selection = interactionManager.selection
    if (selection.length === 0) return
    const rootNode = interactionManager.selection[0]
    if (!rootNode) return
    if (rootNode !== rootNode.parent) return

    const matrix = rootNode.baseMatrix
    matrix.decompose(_matrixPosition, _matrixQuaternion, _matrixScale)

    _rotateEuler.set(
        THREE.MathUtils.degToRad(rot.x),
        THREE.MathUtils.degToRad(rot.y),
        0
    )
    _matrixQuaternion.setFromEuler(_rotateEuler)
    matrix.compose(_matrixPosition, _matrixQuaternion, _matrixScale)

    drafter.updatePatchedNode(rootNode) // must update recusive
}

export function scaleRootFromSelection(n: number) {
    // console.log(n)
    // return
    const selection = interactionManager.selection
    if (selection.length === 0) return
    const rootNode = interactionManager.selection[0]
    if (!rootNode) return
    if (rootNode !== rootNode.parent) return

    const matrix = rootNode.baseMatrix
    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const scale = new THREE.Vector3()

    matrix.decompose(position, quaternion, scale)

    scale.set(n, n, n)

    matrix.compose(position, quaternion, scale)

    drafter.updatePatchedNode(rootNode) // must update recusive
}
