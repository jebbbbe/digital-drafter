import * as THREE from "three"
import {
    drafter,
    raycastHelper,
    selection,
    controllers,
    interactionManager,
} from "../AppContext"
import { moveNodeToPosition } from "../controls/move"
import { getNodevalues } from "../controls/nodes"
import {
    NodeSelectionObject,
    SegmentSelectionObject,
    type SectionSegment,
} from "../interaction/selectionManager"
import * as levaStore from "../../components/Leva/LevaStore"
import type { TransformNode } from "../draft/TransformNode"
import type { NodeLocation } from "../draft/TransformTree"

type MoveListener = {
    move: Function
    up: Function
}
const startHit = new THREE.Vector3()

const _delta = new THREE.Vector3()
const _candidatePosition = new THREE.Vector3()
const _lineDirection = new THREE.Vector3()
const _parentToCandidate = new THREE.Vector3()
const _segmentLineDirection = new THREE.Vector3()
const _segmentMidPoint = new THREE.Vector3()

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
    controllers.pauseControls()

    const handlePointerMove = (moveEvent: PointerEvent) => {
        // get xz pos
        const hit = raycastHelper.castFromEventToPlane(moveEvent)
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
        controllers.setAnchorCache(node.position, anchor)
        moveNodeToPosition(node, _candidatePosition)
    }

    const handlePointerUp = () => {
        levaStore.syncLevaDisplayStub(getNodevalues(node))
        // interactionManager.listeners.removeActiveEvent("pointermove")
        // interactionManager.listeners.removeActiveEvent("pointerup")
        controllers.resumeControls()
    }

    return {
        move: handlePointerMove,
        up: handlePointerUp,
    }
}

export function attachSegmentMove(
    line: SectionSegment,
    startHit: THREE.Vector3
): MoveListener | undefined {
    if (!line) return
    const index = line.index
    const prevHit = new THREE.Vector3().copy(startHit)
    const sectionCutter = drafter.sectionCutter

    controllers.pauseControls()

    const p1 = _delta
    const p2 = _delta

    // origin
    const sectionChild = drafter.sectionCutter.nodeMap.get(index)
    if (sectionChild === undefined) return
    const sectionParent = sectionChild.parent
    if (sectionParent === undefined) return

    _segmentLineDirection.subVectors(
        sectionChild.position,
        sectionParent.position
    )
    const lineLengthSq = _segmentLineDirection.lengthSq()

    const handlePointerMove = (moveEvent: PointerEvent) => {
        const hit = raycastHelper.castFromEventToPlane(moveEvent)
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
        controllers.updateGizmoPosition(_segmentMidPoint)

        prevHit.copy(hit)
    }

    const handlePointerUp = () => {
        controllers.resumeControls()
    }

    return {
        move: handlePointerMove,
        up: handlePointerUp,
    }
}

export function attachInsertGeometry(node: TransformNode) {
    const insertPointerMoveEvent = "insert.pointermove"
    const insertPointerUpEvent = "insert.pointerup"

    selection.clear()
    selection.push(new NodeSelectionObject(node))

    let hasStartedInsert = false

    const handlePointerUp = () => {
        levaStore.syncLevaDisplayStub(getNodevalues(node))
        levaStore.setLevaInsertDefault()
        interactionManager.listeners.removeActiveEvent(insertPointerMoveEvent)
        interactionManager.listeners.removeActiveEvent(insertPointerUpEvent)
    }

    const handlePointerMove = (moveEvent: PointerEvent) => {
        const hit = raycastHelper.castFromEventToPlane(moveEvent)
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
        drafter.updatePatchedNode(node)
    }

    // prettier-ignore
    interactionManager.listeners.addActiveEvent( insertPointerMoveEvent, "pointermove", handlePointerMove, window )
}
