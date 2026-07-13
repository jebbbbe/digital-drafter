import * as THREE from "three"
import { updateSectionChildAttachments } from "../controls/move"
import type { TransformNode } from "./TransformNode"

const angle = -Math.PI / 2
const subtract = new THREE.Vector3()
const up = new THREE.Vector3(0, 1, 0)
const translateToOrigin = new THREE.Matrix4()
const rotation = new THREE.Matrix4()
const translateBack = new THREE.Matrix4()

/**
 * Computes the projection transform between two points for the drafter preview.
 *
 * The returned matrix rotates a descriptive-geometry shape by 90 degrees around
 * an axis perpendicular to the segment from `A` to `B`, using a pivot halfway
 * between the points and halfway up the span.
 *
 * Reference: https://en.wikipedia.org/wiki/Descriptive_geometry
 *
 * @param A - Previous point in the chain.
 * @param B - Next point in the chain.
 * @param matrix - Optional target matrix to write into.
 * @returns The written matrix together with the derived midpoint and rotation axis.
 */
function calculateProjectionMatrix(
    A: THREE.Vector3,
    B: THREE.Vector3,
    matrix: THREE.Matrix4 = new THREE.Matrix4()
): {
    matrix: THREE.Matrix4
    midPoint: THREE.Vector3
    axis: THREE.Vector3
} {
    // reset resuable instances
    subtract.subVectors(B, A)
    translateToOrigin.identity()
    rotation.identity()
    translateBack.identity()

    const height = A.distanceTo(B) / 2

    // new instances to return
    const midPoint = new THREE.Vector3()
        .addVectors(A, B)
        .multiplyScalar(0.5)
        .setY(height)
    const axis = up.clone().cross(subtract).normalize()

    // caculate
    translateToOrigin.makeTranslation(-midPoint.x, -midPoint.y, -midPoint.z)
    rotation.makeRotationAxis(axis, angle)
    translateBack.makeTranslation(midPoint)

    //compund
    matrix
        .identity()
        .multiply(translateBack)
        .multiply(rotation)
        .multiply(translateToOrigin)

    return {
        matrix,
        midPoint: midPoint,
        axis: axis,
    }
}

const _position = new THREE.Vector3()
const _quaternion = new THREE.Quaternion()
const _scale = new THREE.Vector3()
// prettier-ignore
const _mirrorXZ = new THREE.Matrix4().set(
	1, 0, 0, 0,
	0,-1, 0, 0,
	0, 0, 1, 0,
	0, 0, 0, 1
);

export function calculateBaseMatrix(node: TransformNode) {
    calculateBaseMatrixChild(node)
    //update direct childrens base matrix as it depends on parent pos.
    const children = node.children
    for (let i = 0; i < children.length; i++) {
        calculateBaseMatrixChild(children[i])
    }
}

export function calculateBaseMatrixChild(node: TransformNode) {
    const projectionType = node.type

    switch (projectionType) {
        case "root": {
            node.baseMatrix.decompose(_position, _quaternion, _scale)
            node.baseMatrix.compose(node.position, _quaternion, _scale)
            // decompose destroys reflected state in the matrix, we must recreate
            const isReflected = _scale.x * _scale.y * _scale.z < 0
            if (node.mirror !== isReflected) {
                node.baseMatrix.premultiply(_mirrorXZ)
            }
            break
        }
        case "leaf":
            calculateProjectionMatrix(
                node.parent.position,
                node.position,
                node.baseMatrix
            )
            break
        default:
            calculateProjectionMatrix(
                node.parent.position,
                node.position,
                node.baseMatrix
            )
    }
    if (node.type !== "root" && node.mirror) {
        node.baseMatrix.premultiply(_mirrorXZ)
    }
}

export function calculateCompoundMatrix(
    node: TransformNode,
    subTree: TransformNode[] = [],
    localTransform: THREE.Matrix4 = new THREE.Matrix4()
) {
    subTree.push(node)

    const isRoot = node.parent === node

    if (isRoot) {
        node.compoundMatrix.copy(node.baseMatrix).multiply(localTransform)
    } else {
        node.compoundMatrix
            .copy(node.baseMatrix)
            .multiply(node.parent.compoundMatrix)
    }
    if (node.sectionChild) {
        // this will update section cust recusivly, but it is SLOW
        // console.log(node.location)
        updateSectionChildAttachments(node)
    }
}

const _detachWorldBase = new THREE.Matrix4()
const _detachInverseLocal = new THREE.Matrix4()
const _detachRotation = new THREE.Quaternion()
const _detachScale = new THREE.Vector3()
const _detachUnusedPosition = new THREE.Vector3()

export function rebaseDetachedMatrixNodeToRoot(
    node: TransformNode,
    localTransform: THREE.Matrix4
) {
    _detachInverseLocal.copy(localTransform).invert()
    _detachWorldBase.copy(node.compoundMatrix).multiply(_detachInverseLocal)
    _detachWorldBase.decompose(
        _detachUnusedPosition,
        _detachRotation,
        _detachScale
    )
    node.baseMatrix.compose(node.position, _detachRotation, _detachScale)
}
