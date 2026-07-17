import * as THREE from "three"
import { selection, controllers, drafter, eventManager } from "../AppContext"
import * as levaStore from "../../components/Leva/LevaStore"
import {
    detachNode,
    detachNodeChildren,
    mirrorNode,
    addLeafNearbyRandomlyNicely,
} from "./nodes"
import { createNewCutNode } from "./section"
import { moveNodeDelta } from "./move"

export const deleteFirstObject = (object = selection.first()) => object.delete()

async function getUserSelection() {
    let items = selection.filter("TransformNode")
    if (items.length !== 0) {
        return items
    }

    let success = await eventManager.setToolAsync("selectCount", Infinity)
    items = success ? selection.filter("TransformNode") : []
    eventManager.setTool("select")
    return items
}

export const addLeafToSelectedNodes = () => {
    selection.run(
        {
            apply(node) {
                addLeafNearbyRandomlyNicely(node)
            },
        },
        selection.filter("TransformNode")
    )
}

export const cutSelectedNodes = () => {
    selection.run(
        {
            apply(node) {
                createNewCutNode(node)
            },
        },
        selection.filter("TransformNode")
    )
}

export const mirrorSelectedNodes = async () => {
    const items = await getUserSelection()
    if (items.length === 0) return
    selection.run(
        {
            apply(node) {
                mirrorNode(node, false)
            },
            end(nodes) {
                drafter.updatePatchedNodeArray(nodes)
            },
        },
        items
    )
}

export const detachSelectedNodes = () => {
    selection.run(
        {
            apply(node) {
                detachNode(node, false)
            },
            end(nodes) {},
        },
        selection.filter("TransformNode")
    )
}

export const detachChildrenSelectedNodes = () => {
    selection.run(
        {
            apply(node) {
                detachNodeChildren(node, false)
            },
            end(nodes) {},
        },
        selection.filter("TransformNode")
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
