import * as THREE from "three"
import type {
    SelectObject,
    SectionSegment,
} from "../interaction/selectionManager"
import type { TransformNode } from "../draft/TransformNode"
import { pruneNode, detachNode } from "./nodes"
import { deleteSegment } from "./section"
import { drafter, interactionManager } from "../main"
import {
    attachSegmentMove,
    attachNodeMove,
    attachSectionParentMove,
    attachSectionChildMove,
    setupSegmentGizmo,
    moveNodeToPosition,
    moveSectionParentToPosition,
    moveSectionChildToPosition,
    moveSegmentToPosition,
} from "./move"
import * as levaStore from "../../components/Leva/LevaStore"
import { getNodevalues } from "./nodes"

type ControlFn = (object: SelectObject, ...args: any[]) => unknown

function noop(o: SelectObject) {
    console.warn("noop", o)
}

function setupNodeGizmo(object: SelectObject) {
    const node = object.target as TransformNode
    interactionManager.controllers.setGizmoTranslate()
    interactionManager.controllers.setGizmoPosition(node.position)
}

function listenNodeGizmo(object: SelectObject) {
    const node = object.target as TransformNode
    moveNodeToPosition(node, interactionManager.controllers.getGizmoPosition())
}

function moveLeaf(object: SelectObject, startHit: THREE.Vector3) {
    const node = object.target as TransformNode
    levaStore.syncLevaDisplayStub(getNodevalues(node))
    levaStore.enableLeafStub()
    return attachNodeMove(node, startHit)
}

function deleteNodeFromObject(object: SelectObject) {
    const node = object.target as TransformNode
    interactionManager.deselectAll()
    pruneNode(node)
}

function detachNodeFromObject(object: SelectObject) {
    const node = object.target as TransformNode
    detachNode(node)
}

function mirrorNode(object: SelectObject) {
    const node = object.target as TransformNode
    node.mirror = !node.mirror
    console.log(node.mirror)
    drafter.updatePatchedNode(node)
}

const fnLib = {
    // add:{},
    move: {
        SectionSegment: (object: SelectObject, startHit: THREE.Vector3) => {
            const line = object.target as SectionSegment
            // return interactionManager.attachSegmentMove(line, startHit)
            return attachSegmentMove(line, startHit)
        },
        leaf: moveLeaf,
        root: (object: SelectObject, startHit: THREE.Vector3) => {
            const node = object.target as TransformNode
            levaStore.syncLevaDisplayStub(getNodevalues(node))
            levaStore.enableRootStub()
            return attachNodeMove(node, startHit)
        },
        sectionChild: moveLeaf,
        /*
		(object: SelectObject, startHit: THREE.Vector3) => {
            const node = object.target as TransformNode
            levaStore.syncLevaDisplayStub(getNodevalues(node))
            levaStore.enableRootStub()
            return attachSectionChildMove(node, startHit)
        },
		*/
        sectionParent: moveLeaf,
        /* (object: SelectObject, startHit: THREE.Vector3) => {
            const node = object.target as TransformNode
            levaStore.syncLevaDisplayStub(getNodevalues(node))
            levaStore.enableRootStub()
            return attachSectionParentMove(node, startHit)
        },
		*/
    },
    gizmoSetup: {
        SectionSegment: (object: SelectObject) =>
            setupSegmentGizmo(object.target as SectionSegment),
        leaf: setupNodeGizmo,
        root: setupNodeGizmo,
        sectionChild: setupNodeGizmo,
        sectionParent: setupNodeGizmo,
    },
    gizmoListener: {
        SectionSegment: (object: SelectObject) => {
            const line = object.target as SectionSegment
            moveSegmentToPosition(
                line,
                interactionManager.controllers.getGizmoPosition()
            )
        },
        leaf: listenNodeGizmo,
        root: listenNodeGizmo,
        sectionChild: (object: SelectObject) => {
            const node = object.target as TransformNode
            moveSectionChildToPosition(
                node,
                interactionManager.controllers.getGizmoPosition()
            )
        },
        sectionParent: (object: SelectObject) => {
            const node = object.target as TransformNode
            moveSectionParentToPosition(
                node,
                interactionManager.controllers.getGizmoPosition()
            )
        },
    },
    // prune:{},
    delete: {
        SectionSegment: (object: SelectObject) => {
            const line = object.target as SectionSegment
            deleteSegment(line)
        },
        leaf: deleteNodeFromObject,
        root: deleteNodeFromObject,
        sectionChild: deleteNodeFromObject,
        sectionParent: deleteNodeFromObject,
    },
    detach: {
        SectionSegment: noop,
        leaf: detachNodeFromObject,
        root: detachNodeFromObject,
        sectionChild: detachNodeFromObject,
        sectionParent: detachNodeFromObject,
    },
    mirror: {
        SectionSegment: noop,
        leaf: mirrorNode,
        root: mirrorNode,
        sectionChild: mirrorNode,
        sectionParent: mirrorNode,
    },
}

function runTypedfn(
    key: keyof typeof fnLib,
    object: SelectObject = interactionManager.selection.first(),
    ...args: any[]
) {
    if (!object) return
    return (fnLib[key][object.kind] as ControlFn)(object, ...args)
}

export const deleteFirstObject = (o?: SelectObject) => runTypedfn("delete", o)
export const detachFirstObject = (o?: SelectObject) => runTypedfn("detach", o)
export const moveFirstObject = (o?: SelectObject, ...args: any[]) =>
    runTypedfn("move", o, ...args)
export const gizmoSetupFirstObject = (o?: SelectObject) => () =>
    runTypedfn("gizmoSetup", o)

export const gizmoListenerFirstObject = (o?: SelectObject) => () =>
    runTypedfn("gizmoListener", o)

export const mirrorFirstObject = (o?: SelectObject) => runTypedfn("mirror", o)
