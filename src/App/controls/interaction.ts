import * as THREE from "three"
import { selection, controllers, drafter, eventManager } from "../AppContext"
import * as levaStore from "../../components/Leva/LevaStore"
import { addLeafNearbyRandomlyNicely } from "./nodes"
import { createNewCutNode } from "./section"
import { moveNodeDelta } from "./move"
import { getNodevalues } from "./nodes"

export const deleteFirstObject = (object = selection.first()) => {
    object.delete()
    deSelectAll()
}

function panelDetachedUpdate(nodes: any[]) {
    if (nodes.length === 1) {
        const node = nodes[0]
        // update stub panel
        levaStore.enableNodeStub(node.parent === node)
        // todo the rotation value derived from this are wong due to how rebaseDetachedMatrixNodeToRoot gets the new matrix..
        levaStore.syncLevaDisplayStub(getNodevalues(node))
    }
}

async function getUserSelection() {
    if (eventManager.asyncToolActive) return []

    let items = selection.filter("TransformNode")
    if (items.length !== 0) {
        return items
    }

    let success = await eventManager.setToolAsync("selectCount", Infinity)
    items = success ? selection.filter("TransformNode") : []
    eventManager.setTool("select")
    return items
}

export const addLeafToSelectedNodes = async () => {
    const items = await getUserSelection()
    if (items.length === 0) return
    selection.run(
        {
            apply(node) {
                addLeafNearbyRandomlyNicely(node)
            },
        },
        items
    )
}

export const cutSelectedNodes = async () => {
    const items = await getUserSelection()
    if (items.length === 0) return
    selection.run(
        {
            apply(node) {
                createNewCutNode(node)
            },
        },
        items
    )
}

export const mirrorSelectedNodes = async () => {
    const items = await getUserSelection()
    if (items.length === 0) return
    selection.run(
        {
            apply(node) {
                node.mirrorNode(false)
            },
            end(nodes) {
                drafter.updatePatchedNodeArray(nodes)
            },
        },
        items
    )
}

export const detachSelectedNodes = async () => {
    const items = await getUserSelection()
    if (items.length === 0) return
    selection.run(
        {
            apply(node) {
                node.detachNode()
            },
            end(nodes) {
                panelDetachedUpdate(nodes)
            },
        },
        items
    )
}

export const detachChildrenSelectedNodes = async () => {
    const items = await getUserSelection()
    if (items.length === 0) return
    selection.run(
        {
            apply(node) {
                node.detachChildren()
            },
            end(nodes) {
                panelDetachedUpdate(nodes)
            },
        },
        items
    )
}

export const detachAllSelectedNodes = async () => {
    const items = await getUserSelection()
    if (items.length === 0) return
    selection.run(
        {
            apply(node) {
                node.detachAll()
            },
            end(nodes) {
                panelDetachedUpdate(nodes)
            },
        },
        items
    )
}

export const moveDeltaSelectedNodes = (delta: THREE.Vector3) => {
    selection.run(
        {
            apply(node) {
                moveNodeDelta(node, delta, false)
            },
            end(nodes) {
                drafter.updatePatchedNodeArray(nodes)
            },
        },
        selection.filter("TransformNode")
    )
}

export const moveAbsoluteSelectedNodes = (position: THREE.Vector3) => {
    const delta = new THREE.Vector3().subVectors(
        position,
        selection.averagePosition
    )
    selection.run(
        {
            apply(node) {
                moveNodeDelta(node, delta, false)
            },
            end(nodes) {
                drafter.updatePatchedNodeArray(nodes)
            },
        },
        selection.filter("TransformNode")
    )
    return delta
}

export function deSelectAll() {
    // hide transform controls
    controllers.detachTransformControls()
    //clear selecction geo
    selection.clear()
    // detach leva
    levaStore.syncLevaDisplayStub({
        positionValue: { x: 0, z: 0 },
        rotateValue: { x: 0, y: 0 },
        scaleValue: 1.0,
    })
    levaStore.disableStub()
}
