import * as THREE from "three"
import { constants } from "../constants"
import { camera, orbitControls } from "../AppContext"

export function resetCamera(): void {
    camera.zoom = constants.camera.zoom
    camera.position.set(...constants.camera.position)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
    orbitControls.target.set(0, 0, 0)
    orbitControls.update()
}

export function toggleCameraRotation(): void {
    const enableRotate = !orbitControls.enableRotate
    syncCameraRotationBindings(enableRotate)

    if (!enableRotate) {
        resetCamera()
    }
}

function syncCameraRotationBindings(enableRotate: boolean): void {
    orbitControls.enableRotate = enableRotate
    orbitControls.mouseButtons.LEFT = enableRotate
        ? THREE.MOUSE.ROTATE
        : THREE.MOUSE.PAN
    orbitControls.mouseButtons.RIGHT = THREE.MOUSE.PAN
    orbitControls.touches.ONE = enableRotate
        ? THREE.TOUCH.ROTATE
        : THREE.TOUCH.PAN
    orbitControls.touches.TWO = THREE.TOUCH.DOLLY_PAN
}
