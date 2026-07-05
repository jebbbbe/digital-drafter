import * as THREE from "three"
import type { SelectObject } from "../interaction"
import { selection, controllers } from "../AppContext"
import * as levaStore from "../../components/Leva/LevaStore"

function getSelectionObject(object = selection.first()) {
    return object
}

export const deleteFirstObject = (object?: SelectObject) =>
    getSelectionObject(object)?.delete()

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

export const mirrorFirstObject = (object?: SelectObject) =>
    getSelectionObject(object)?.mirror()

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
