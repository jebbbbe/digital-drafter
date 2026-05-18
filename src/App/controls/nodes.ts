import * as THREE from "three"
import * as rand from "../utils/random"
import { drafter, interactionManager } from "../main"
import type { TransformNode } from "../draft/TransformNode"
import { getSlotIndex } from "../draft/TransformTree"

const PI = Math.PI
const PIo2 = PI / 2
const _position = new THREE.Vector3()
const _quaternion = new THREE.Quaternion()
const _scale = new THREE.Vector3()
const _posOffset = new THREE.Vector3()
const _rotateEuler = new THREE.Euler(0, 0, 0, "YXZ")
const _extractEuler = new THREE.Euler()

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

export function addLeafNearbyRandomlyFromSelection() {
    const selection = interactionManager.selection
    if (selection.length === 0) return
    const node = interactionManager.selection[0]
    if (!node) return
    // addLeafNearbyRandomly(node)
    addLeafNearbyRandomlyNicely(node)
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
    const startRandom = rItems.length * tItems.length
    const maxTries = 100
    for (let cnt = 0; cnt < maxTries + 1; cnt++) {
        let r, t
        if (cnt < startRandom) {
            r = rand.randomItem(rItems)
            t = rand.randomItem(tItems)
        } else if (cnt >= maxTries) {
            r = 1.5
            t = rand.random(0, PI * 2)
        } else {
            r = rand.random(1, 6)
            t = rand.random(0, PI * 2)
        }

        _posOffset.setFromSphericalCoords(r, PIo2, t)
        const candidatePosition = new THREE.Vector3().addVectors(
            node.position,
            _posOffset
        )

        let nearestDist = Infinity
        for (let i = 0; i < near.length; i++) {
            const d = candidatePosition.distanceToSquared(near[i])
            nearestDist = Math.min(d, nearestDist)
        }

        if (cnt >= maxTries) {
            nearestDist = minDist * minDist + 1
        }

        if (Math.sqrt(nearestDist) >= minDist) {
            const newNode = {
                position: candidatePosition,
            }
            drafter.addLeafNode(newNode, node.location)
            return
        }
    }
}

export function pruneNodeFromSelection() {
    const selection = interactionManager.selection
    if (selection.length === 0) return
    const node = interactionManager.selection[0]
    if (!node) return
    pruneNode(node)
}

export function pruneNode(node: TransformNode) {
    drafter.sectionCutter.deleteFromNodeSlot(getSlotIndex(node.location))
    drafter.pruneNode(node)
    // drafter.removeNode(node)
    interactionManager.onPruneNode()
}

export function moveNodeFromSelection(pos: { x: number; z: number }) {
    console.log(pos)
    const selection = interactionManager.selection
    if (selection.length === 0) return
    const node = interactionManager.selection[0]
    if (!node) return

    node.position.set(pos.x, 0, pos.z)
    drafter.updatePatchedNode(node)

    // update gui
}

export function rotateRootFromSelection(rot: { x: number; y: number }) {
    const selection = interactionManager.selection
    if (selection.length === 0) return
    const rootNode = interactionManager.selection[0]
    if (!rootNode) return
    if (rootNode !== rootNode.parent) return

    const matrix = rootNode.baseMatrix
    matrix.decompose(_position, _quaternion, _scale)
    _rotateEuler.set(
        THREE.MathUtils.degToRad(rot.x),
        0,
        THREE.MathUtils.degToRad(-rot.y)
    )
    _quaternion.setFromEuler(_rotateEuler)
    matrix.compose(_position, _quaternion, _scale)

    drafter.updatePatchedNode(rootNode)
}

export function scaleRootFromSelection(n: number) {
    const selection = interactionManager.selection
    if (selection.length === 0) return
    const rootNode = interactionManager.selection[0]
    if (!rootNode) return
    if (rootNode !== rootNode.parent) return

    const matrix = rootNode.baseMatrix

    matrix.decompose(_position, _quaternion, _scale)
    _scale.set(n, n, n)
    matrix.compose(_position, _quaternion, _scale)
    drafter.updatePatchedNode(rootNode)
}

// manager -> leva
export type NodeMatrixValues = {
    positionValue?: { x: number; z: number } | undefined
    rotateValue?: { x: number; y: number } | undefined
    scaleValue?: number | undefined
}

export function getNodevalues(node: TransformNode): NodeMatrixValues {
    const isRoot = node === node.parent

    const values = {} as NodeMatrixValues

    const matrix = node.baseMatrix
    matrix.decompose(_position, _quaternion, _scale)

    values.positionValue = { x: _position.x, z: _position.z }

    if (isRoot) {
        _extractEuler.setFromQuaternion(_quaternion)
        values.rotateValue = {
            x: THREE.MathUtils.radToDeg(_extractEuler.x),
            y: -THREE.MathUtils.radToDeg(_extractEuler.z),
        }
        values.scaleValue = _scale.x
    }
    return values
}
