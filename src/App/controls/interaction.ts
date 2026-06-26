import * as THREE from "three"
import type { SelectObject } from "../interaction/selectionManager"
import { interactionManager } from "../main"

function getSelectionObject(object = interactionManager.selection.first()) {
    return object
}

export const deleteFirstObject = (object?: SelectObject) =>
    getSelectionObject(object)?.delete()

export const detachFirstObject = (object?: SelectObject) =>
    getSelectionObject(object)?.detach()

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
