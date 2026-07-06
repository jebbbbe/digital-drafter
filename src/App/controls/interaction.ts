import * as THREE from "three"
import type { SelectObject } from "../selection"
import { selection, controllers, drafter } from "../AppContext"
import * as levaStore from "../../components/Leva/LevaStore"
import { detachNode, detachNodeChildren, mirrorNode } from "./nodes"

function getSelectionObject(object = selection.first()) {
    return object
}

export const deleteFirstObject = (object?: SelectObject) =>
    getSelectionObject(object)?.delete()

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

export const detachFirstObject = (object?: SelectObject) =>
    getSelectionObject(object)?.detach()

export const detachChildrenFirstObject = (object?: SelectObject) => {
    object = getSelectionObject(object)
    object?.detachChildren()
}

export const moveFirstObject = (
    object?: SelectObject,
    startHit?: THREE.Vector3
) => {
    if (!startHit) return
    return getSelectionObject(object)?.move(startHit)
}

export const gizmoSetupFirstObject = (object?: SelectObject) => () =>
    getSelectionObject(object)?.gizmoSetup()

export const gizmoListenerFirstObject = (object?: SelectObject) => () =>
    getSelectionObject(object)?.gizmoListener()

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
