import type * as THREE from "three"
import type {
    SelectObject,
    SectionSegment,
} from "../interaction/selectionManager"
import type { TransformNode } from "../draft/TransformNode"
import { pruneNode, detachNode } from "./nodes"
import { deleteSegment } from "./section"
import { interactionManager } from "../main"
import {
    attachSegmentMove,
    attachNodeMove,
    attachSectionParentMove,
    attachSectionChildMove,
} from "./move"
import * as levaStore from "../../components/Leva/LevaStore"
import { getNodevalues } from "./nodes"

type ControlFn = (object: SelectObject, ...args: any[]) => unknown

function noop(o: SelectObject) {
    console.warn("noop", o)
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
        sectionChild: (object: SelectObject, startHit: THREE.Vector3) => {
            const node = object.target as TransformNode
            levaStore.syncLevaDisplayStub(getNodevalues(node))
            levaStore.enableRootStub()
            return attachSectionChildMove(node, startHit)
        },
        sectionParent: (object: SelectObject, startHit: THREE.Vector3) => {
            const node = object.target as TransformNode
            levaStore.syncLevaDisplayStub(getNodevalues(node))
            levaStore.enableRootStub()
            return attachSectionParentMove(node, startHit)
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
}

function runTypedfn(
    key: keyof typeof fnLib,
    object: SelectObject = interactionManager.selection.first(),
    ...args: any[]
) {
    if (!object) return
    console.log({ object })
    return (fnLib[key][object.kind] as ControlFn)(object, ...args)
}

export const deleteFirstObject = (o?: SelectObject) => runTypedfn("delete", o)
export const detachFirstObject = (o?: SelectObject) => runTypedfn("detach", o)
export const moveFirstObject = (o?: SelectObject, ...args: any[]) =>
    runTypedfn("move", o, ...args)
