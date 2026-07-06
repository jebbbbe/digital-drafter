import * as THREE from "three"
import type { SelectObject } from "../selection"
import { selection, controllers, drafter } from "../AppContext"
import * as levaStore from "../../components/Leva/LevaStore"
import {
    detachNode,
    detachNodeChildren,
    mirrorNode,
    addLeafNearbyRandomlyNicely,
} from "./nodes"
import { createNewCutNode } from "./section"

export const deleteFirstObject = (object = selection.first()) => object.delete()

export const addLeafToSelectedNodes = () => {
    selection.run(
        {
            apply(node) {
                addLeafNearbyRandomlyNicely(node)
            },
        },
        selection.filterTargets("TransformNode")
    )
}

export const cutSelectedNodes = () => {
    selection.run(
        {
            apply(node) {
                createNewCutNode(node)
            },
        },
        selection.filterTargets("TransformNode")
    )
}

export const mirrorSelectedNodes = () => {
    selection.run(
        {
            apply(node) {
                mirrorNode(node, false)
            },
            end(nodes) {
                drafter.updatePatchedNodeArray(nodes)
            },
        },
        selection.filterTargets("TransformNode")
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
        selection.filterTargets("TransformNode")
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
        selection.filterTargets("TransformNode")
    )
}

export const moveFirstObject = (
    object = selection.first(),
    startHit?: THREE.Vector3
) => {
    if (!startHit) return
    return object.move(startHit)
}

export const gizmoSetupFirstObject =
    (object = selection.first()) =>
    () =>
        object.gizmoSetup()

export const gizmoListenerFirstObject =
    (object = selection.first()) =>
    () =>
        object.gizmoListener()

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
