import * as THREE from "three"
import type { SegmentAttachment, TransformNode } from "@types"
import { drafter, controllers } from "../AppContext"
import { rotatePointOnXZPlane, getXZRotationAngle } from "../utils/rotation"
import { updateCutNode } from "./section"

const _prevPosition = new THREE.Vector3()
const _delta = new THREE.Vector3()
const _segmentLineDirection = new THREE.Vector3()
const _segmentMidPoint = new THREE.Vector3()
const _segmentDirection = new THREE.Vector3()
const _segmentQuaternion = new THREE.Quaternion()
const _segmentZAxis = new THREE.Vector3(0, 0, -1)
const _sectionChildPosition = new THREE.Vector3()

function updateSectionParentAttachments(node: TransformNode, delta = _delta) {
    //  move all children nodes
    const children = node.children
    for (let i = 0; i < children.length; i++) {
        const child = children[i]
        if (!child.sectionChild) continue

        const attachment = child.attachments.segment
        if (attachment === undefined) continue

        const index = attachment.index
        drafter.sectionCutter.moveSegmentVector(delta, delta, index)
    }
}

export function moveNodeToPosition(
    node: TransformNode,
    nextPosition: THREE.Vector3
) {
    _prevPosition.copy(node.position)
    node.position.copy(nextPosition)
    _delta.subVectors(node.position, _prevPosition)
    if (_delta.lengthSq() === 0) return false

    if (node.sectionParent) updateSectionParentAttachments(node)
    drafter.updatePatchedNode(node)

    return true
}

export function moveNodeDelta(
    node: TransformNode,
    delta: THREE.Vector3,
    recusrive = true
) {
    node.position.add(delta)
    if (node.sectionParent) updateSectionParentAttachments(node, delta)
    if (recusrive) drafter.updatePatchedNode(node)
}

export function updateSectionChildAttachments(node: TransformNode) {
    // return
    const segment = node.attachments.segment
    if (segment === undefined) return

    const parentPos = node.parent.position
    const index = segment.index
    const [a, b] = drafter.sectionCutter.getSegmentAsVector(index)

    _segmentDirection.subVectors(b, a).setY(0)
    if (_segmentDirection.lengthSq() === 0) return

    _segmentDirection.normalize()
    _sectionChildPosition.set(
        parentPos.x - _segmentDirection.z,
        parentPos.y,
        parentPos.z + _segmentDirection.x
    )

    const rotateAngle = getXZRotationAngle(
        parentPos,
        _sectionChildPosition,
        node.position
    )

    rotatePointOnXZPlane(a, rotateAngle, parentPos, a)
    rotatePointOnXZPlane(b, rotateAngle, parentPos, b)
    drafter.sectionCutter.patchSegmentVector(a, b, index)

    //update FACE attachment
    updateCutNode(a, b, node)

    return
}

export function setupSegmentGizmo(line: SegmentAttachment) {
    const [a, b] = drafter.sectionCutter.getSegmentAsVector(line.index)

    _segmentMidPoint.addVectors(a, b).multiplyScalar(0.5)
    _segmentDirection.subVectors(b, a)

    controllers.cachedAnchorOffset.set(0, 0, 0)
    controllers.setGizmoTranslate1d()
    controllers.setGizmoPosition(_segmentMidPoint)

    if (_segmentDirection.lengthSq() === 0) {
        _segmentQuaternion.identity()
    } else {
        _segmentQuaternion.setFromUnitVectors(
            _segmentZAxis,
            _segmentDirection.normalize()
        )
    }

    controllers.setGizmoQuaternion(_segmentQuaternion)
}

export function moveSegmentToPosition(
    line: SegmentAttachment,
    nextPosition: THREE.Vector3
) {
    const index = line.index
    const sectionChild = drafter.sectionCutter.nodeMap.get(index)
    if (sectionChild === undefined) return false

    const sectionParent = sectionChild.parent
    if (sectionParent === undefined) return false

    _segmentLineDirection.subVectors(
        sectionChild.position,
        sectionParent.position
    )
    const lineLengthSq = _segmentLineDirection.lengthSq()
    if (lineLengthSq === 0) return false

    const [a, b] = drafter.sectionCutter.getSegmentAsVector(index)
    _segmentMidPoint.addVectors(a, b).multiplyScalar(0.5)
    _delta.subVectors(nextPosition, _segmentMidPoint)

    const deltaAlongLine = _delta.dot(_segmentLineDirection) / lineLengthSq
    _delta.copy(_segmentLineDirection).multiplyScalar(deltaAlongLine)
    if (_delta.lengthSq() === 0) return false

    drafter.sectionCutter.moveSegmentVector(_delta, _delta, index)

    const [nextA, nextB] = drafter.sectionCutter.getSegmentAsVector(index)
    drafter.updatePatchedNode(sectionChild)
    _segmentMidPoint.addVectors(nextA, nextB).multiplyScalar(0.5)
    controllers.updateGizmoPosition(_segmentMidPoint)

    return true
}
