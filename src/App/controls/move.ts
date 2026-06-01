import * as THREE from "three"
import type { TransformNode } from "../draft/TransformNode"
import type { SectionSegment } from "../interaction/selectionManager"
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

function moveNodeGeneric(
    node: TransformNode,
    startHit: THREE.Vector3,
    attachmentUpdate: Function = () => {}
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

        _prevPosition.copy(node.position)
        _delta.subVectors(hit, prevHit)
        if (_delta.lengthSq() === 0) return

        _candidatePosition.copy(_prevPosition).add(_delta)

        const constrainMove =
            moveEvent.shiftKey && parentPosition && lineLengthSq > 0

        if (constrainMove) {
            const t = _parentToCandidate
                .subVectors(_candidatePosition, parentPosition)
                .dot(_lineDirection)

            node.position
                .copy(parentPosition)
                .addScaledVector(_lineDirection, t / lineLengthSq)
        } else {
            node.position.copy(_candidatePosition)
        }

        //get delta
        _delta.subVectors(node.position, _prevPosition)
        prevHit.copy(hit)

        // no move exit early
        if (_delta.lengthSq() === 0) return

        // update recusive on node
        interactionManager.drafter.updatePatchedNode(node)

        attachmentUpdate(node)

        // updateGizmoPosition
        interactionManager.controllers.setGizmoPosition(node.position)
        // update leva values
        levaStore.syncLevaDisplayStub(getNodevalues(node))
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

export const attachNodeMove = (n: TransformNode, h: THREE.Vector3) =>
    moveNodeGeneric(n, h)

function updateSectionParentAttachments(node: TransformNode) {
    //  move all children nodes
    const children = node.children
    for (let i = 0; i < children.length; i++) {
        const child = children[i]
        if (child.type !== "sectionChild") continue

        const attachment = interactionManager.drafter.attachments.getByKind(
            child,
            "segment"
        )[0]
        if (attachment === undefined) continue

        // child.position.add(_delta) // Hmmmm
        const index = attachment.index
        interactionManager.drafter.sectionCutter.moveSegmentVector(
            _delta,
            _delta,
            index
        )
    }
}

export const attachSectionParentMove = (n: TransformNode, h: THREE.Vector3) =>
    moveNodeGeneric(n, h, updateSectionParentAttachments)

const _newPosition = new THREE.Vector3()
function updateSectionChildAttachments(node: TransformNode) {
    const delta = _delta // globally scoped in this file, bad org fix later

    // rotate about
    const prevPos = node.position
    const parentPos = node.parent.position
    _newPosition.addVectors(prevPos, delta)
    const rotateAngle = getXZRotationAngle(parentPos, prevPos, _newPosition)

    //update SEGMENT attachment
    const segment = interactionManager.drafter.attachments.getByKind(
        node,
        "segment"
    )[0]
    if (segment === undefined) return

    const index = segment.index
    const [a, b] = drafter.sectionCutter.getSegmentAsVector(index)
    rotatePointOnXZPlane(a, rotateAngle, parentPos, a)
    rotatePointOnXZPlane(b, rotateAngle, parentPos, b)
    drafter.sectionCutter.patchSegmentVector(a, b, index)

    updateCutNode(a, b, node)

    //update FACE attachment
    // const faceGroup = interactionManager.drafter.attachments.getByKind(
    //     node,
    //     "section"
    // )[0]

    return
    //  move all children nodes
    const children = node.children
    for (let i = 0; i < children.length; i++) {
        const child = children[i]
        if (child.type !== "sectionChild") continue

        const attachment = interactionManager.drafter.attachments.getByKind(
            child,
            "segment"
        )[0]
        if (attachment === undefined) continue

        // child.position.add(_delta) // Hmmmm
        const index = attachment.index
        interactionManager.drafter.sectionCutter.moveSegmentVector(
            _delta,
            _delta,
            index
        )
    }
}

export const attachSectionChildMove = (n: TransformNode, h: THREE.Vector3) =>
    moveNodeGeneric(n, h, updateSectionChildAttachments)

export function attachSegmentMove(
    line: SectionSegment,
    startHit: THREE.Vector3
): MoveListener | undefined {
    if (!line) return
    const index = line.index
    const prevHit = new THREE.Vector3().copy(startHit)
    const sectionCutter = interactionManager.drafter.sectionCutter

    interactionManager.controllers.pauseControls()

    let p1 = _delta
    let p2 = _delta

    /*
    if (mode === "start") {
        p2 = _zero
    } else if (mode === "end") {
        p1 = _zero
    }
    */

    // origin
    const node = interactionManager.drafter.sectionCutter.nodeMap.get(index)
    if (node === undefined) return
    const parent = node.parent
    if (parent === undefined) return

    const handlePointerMove = (moveEvent: PointerEvent) => {
        const shiftHeld = moveEvent.shiftKey
        if (shiftHeld) {
            console.warn("not implemented")
        } else {
            const hit =
                interactionManager.raycastHelper.castFromEventToPlane(moveEvent)
            if (!hit) return

            _delta.subVectors(hit, prevHit)
            if (_delta.lengthSq() === 0) return

            sectionCutter.moveSegmentVector(p1, p2, index)
            prevHit.copy(hit)
        }
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
    interactionManager.selection.push({
        kind: "leaf",
        target: node,
    })

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
