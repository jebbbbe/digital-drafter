import * as THREE from "three"
import type { TransformNode } from "../draft/TransformNode"
import {
    NodeSelectionObject,
    type SectionSegment,
} from "../interaction/selectionManager"
import { interactionManager, drafter } from "../main"
import { getNodevalues } from "./nodes"
import { rotatePointOnXZPlane, getXZRotationAngle } from "../utils/rotation"
import * as levaStore from "../../components/Leva/LevaStore"
import { updateCutNode } from "./section"

type MoveListener = {
    move: Function
    up: Function
}

const _prevPosition = new THREE.Vector3()
const _delta = new THREE.Vector3()
const _candidatePosition = new THREE.Vector3()
const _lineDirection = new THREE.Vector3()
const _parentToCandidate = new THREE.Vector3()
const _segmentLineDirection = new THREE.Vector3()
const _segmentMidPoint = new THREE.Vector3()
const _segmentDirection = new THREE.Vector3()
const _segmentQuaternion = new THREE.Quaternion()
const _segmentZAxis = new THREE.Vector3(0, 0, -1)
const _sectionChildPosition = new THREE.Vector3()

function updateSectionParentAttachments(node: TransformNode) {
    //  move all children nodes
    const children = node.children
    for (let i = 0; i < children.length; i++) {
        const child = children[i]
        if (!child.sectionChild) continue

        const attachment = child.attachments.segment
        if (attachment === undefined) continue

        const index = attachment.index
        interactionManager.drafter.sectionCutter.moveSegmentVector(
            _delta,
            _delta,
            index
        )
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
    interactionManager.drafter.updatePatchedNode(node)
    interactionManager.controllers.updateGizmoPosition(node.position)
    levaStore.syncLevaDisplayStub(getNodevalues(node))

    return true
}

export function attachNodeMove(
    node: TransformNode,
    startHit: THREE.Vector3
): MoveListener | undefined {
    if (!node) return

    const prevHit = new THREE.Vector3().copy(startHit)
    const hasParentConstraint = node.parent !== node
    const parentPosition = hasParentConstraint
        ? node.parent.position.clone()
        : undefined
    const lineLengthSq = hasParentConstraint
        ? _lineDirection
              .subVectors(node.position, node.parent.position)
              .lengthSq()
        : 0
    interactionManager.controllers.pauseControls()

    const handlePointerMove = (moveEvent: PointerEvent) => {
        // get xz pos
        const hit =
            interactionManager.raycastHelper.castFromEventToPlane(moveEvent)
        if (!hit) return

        _delta.subVectors(hit, prevHit)
        if (_delta.lengthSq() === 0) return

        _candidatePosition.copy(node.position).add(_delta)

        const constrainMove =
            moveEvent.shiftKey && parentPosition && lineLengthSq > 0

        if (constrainMove) {
            const t = _parentToCandidate
                .subVectors(_candidatePosition, parentPosition)
                .dot(_lineDirection)

            _candidatePosition
                .copy(parentPosition)
                .addScaledVector(_lineDirection, t / lineLengthSq)
        }
        prevHit.copy(hit)

        const anchor = drafter.getNodesAnchoredCenter(node)
        interactionManager.controllers.setAnchorCache(node.position, anchor)
        moveNodeToPosition(node, _candidatePosition)
    }

    const handlePointerUp = () => {
        levaStore.syncLevaDisplayStub(getNodevalues(node))
        interactionManager.listeners.removeActiveEvent("pointermove")
        interactionManager.listeners.removeActiveEvent("pointerup")
        interactionManager.controllers.resumeControls()
    }

    return {
        move: handlePointerMove,
        up: handlePointerUp,
    }
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

export function setupSegmentGizmo(line: SectionSegment) {
    const [a, b] = drafter.sectionCutter.getSegmentAsVector(line.index)

    _segmentMidPoint.addVectors(a, b).multiplyScalar(0.5)
    _segmentDirection.subVectors(b, a)

    interactionManager.controllers.cachedAnchorOffset.set(0, 0, 0)
    interactionManager.controllers.setGizmoTranslate1d()
    interactionManager.controllers.setGizmoPosition(_segmentMidPoint)

    if (_segmentDirection.lengthSq() === 0) {
        _segmentQuaternion.identity()
    } else {
        _segmentQuaternion.setFromUnitVectors(
            _segmentZAxis,
            _segmentDirection.normalize()
        )
    }

    interactionManager.controllers.setGizmoQuaternion(_segmentQuaternion)
}

export function moveSegmentToPosition(
    line: SectionSegment,
    nextPosition: THREE.Vector3
) {
    const index = line.index
    const sectionChild =
        interactionManager.drafter.sectionCutter.nodeMap.get(index)
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

    interactionManager.drafter.sectionCutter.moveSegmentVector(
        _delta,
        _delta,
        index
    )

    const [nextA, nextB] = drafter.sectionCutter.getSegmentAsVector(index)
    drafter.updatePatchedNode(sectionChild)
    _segmentMidPoint.addVectors(nextA, nextB).multiplyScalar(0.5)
    interactionManager.controllers.updateGizmoPosition(_segmentMidPoint)

    return true
}

export function attachSegmentMove(
    line: SectionSegment,
    startHit: THREE.Vector3
): MoveListener | undefined {
    if (!line) return
    const index = line.index
    const prevHit = new THREE.Vector3().copy(startHit)
    const sectionCutter = interactionManager.drafter.sectionCutter

    interactionManager.controllers.pauseControls()

    const p1 = _delta
    const p2 = _delta

    // origin
    const sectionChild =
        interactionManager.drafter.sectionCutter.nodeMap.get(index)
    if (sectionChild === undefined) return
    const sectionParent = sectionChild.parent
    if (sectionParent === undefined) return

    _segmentLineDirection.subVectors(
        sectionChild.position,
        sectionParent.position
    )
    const lineLengthSq = _segmentLineDirection.lengthSq()

    const handlePointerMove = (moveEvent: PointerEvent) => {
        const hit =
            interactionManager.raycastHelper.castFromEventToPlane(moveEvent)
        if (!hit) return

        // normal move
        _delta.subVectors(hit, prevHit)
        if (_delta.lengthSq() === 0) return

        // constrained move
        const deltaAlongLine = _delta.dot(_segmentLineDirection) / lineLengthSq
        _delta.copy(_segmentLineDirection).multiplyScalar(deltaAlongLine)
        if (_delta.lengthSq() === 0) return

        sectionCutter.moveSegmentVector(p1, p2, index)

        const [a, b] = drafter.sectionCutter.getSegmentAsVector(index)
        drafter.updatePatchedNode(sectionChild)

        _segmentMidPoint.addVectors(a, b).multiplyScalar(0.5)
        interactionManager.controllers.updateGizmoPosition(_segmentMidPoint)

        prevHit.copy(hit)
    }

    const handlePointerUp = () => {
        interactionManager.listeners.removeActiveEvent("pointermove")
        interactionManager.listeners.removeActiveEvent("pointerup")
        interactionManager.controllers.resumeControls()
    }

    return {
        move: handlePointerMove,
        up: handlePointerUp,
    }
}

export function attachInsertGeometry(node: TransformNode) {
    const insertPointerMoveEvent = "insert.pointermove"
    const insertPointerUpEvent = "insert.pointerup"

    interactionManager.selection.clear()
    interactionManager.selection.push(new NodeSelectionObject(node))

    let hasStartedInsert = false

    const handlePointerUp = () => {
        levaStore.syncLevaDisplayStub(getNodevalues(node))
        levaStore.setLevaInsertDefault()
        interactionManager.selection.clear()
        interactionManager.listeners.removeActiveEvent(insertPointerMoveEvent)
        interactionManager.listeners.removeActiveEvent(insertPointerUpEvent)
    }

    const handlePointerMove = (moveEvent: PointerEvent) => {
        const hit =
            interactionManager.raycastHelper.castFromEventToPlane(moveEvent)
        if (!hit) return

        if (!hasStartedInsert) {
            hasStartedInsert = true
            interactionManager.listeners.addActiveEvent(
                insertPointerUpEvent,
                "pointerup",
                handlePointerUp,
                window
            )
        }

        node.position.copy(hit)
        interactionManager.drafter.updatePatchedNode(node)
    }

    // prettier-ignore
    interactionManager.listeners.addActiveEvent( insertPointerMoveEvent, "pointermove", handlePointerMove, window )
}
