import * as THREE from "three"
import { isAppReady, drafter, scene } from "../main"
import { constants } from "../constants"
import { syncLevaDisplayControls } from "../../components/Leva/LevaStore"

export function setSceneColor(value: string): void {
    if (!isAppReady) return
    ;(scene.background as THREE.Color).set(value)
}

export function setMeshColor(value: string): void {
    if (!isAppReady) return
    drafter.materials.mesh.color.set(value)
}

export function setMeshVisible(value: boolean): void {
    if (!isAppReady) return
    drafter.materials.mesh.visible = value
}

export function setLineColor(value: string): void {
    if (!isAppReady) return
    drafter.materials.line.color.set(value)
}

export function setLineVisible(value: boolean): void {
    if (!isAppReady) return
    drafter.materials.line.visible = value
}

export function setDashColor(value: string): void {
    if (!isAppReady) return
    const len = drafter.instanceItems.length
    for (let i = 0; i < len; i++) {
        const instanceItem = drafter.instanceItems[i]
        if (!instanceItem) continue
        instanceItem.instances.dash.material.color.set(value)
    }
}

export function setDashVisible(value: boolean): void {
    // todo
    // we should set visible on mesh, not material.
    // not implemented with settings
    if (!isAppReady) return
    const len = drafter.instanceItems.length
    for (let i = 0; i < len; i++) {
        const instanceItem = drafter.instanceItems[i]
        if (!instanceItem) continue
        instanceItem.instances.dash.material.visible = value
    }
}

export function setProjectionColor(value: string): void {
    if (!isAppReady) return
    const len = drafter.instanceItems.length
    for (let i = 0; i < len; i++) {
        const instanceItem = drafter.instanceItems[i]
        if (!instanceItem) continue
        instanceItem.instances.proj.material.color.set(value)
    }
}

export function setProjectionVisible(value: boolean): void {
    // todo
    // we should set visible on mesh, not material.
    // not implemented with settings
    if (!isAppReady) return
    const len = drafter.instanceItems.length
    for (let i = 0; i < len; i++) {
        const instanceItem = drafter.instanceItems[i]
        if (!instanceItem) continue
        instanceItem.instances.proj.material.visible = value
    }
}

export function randomizeMeshColor(): void {
    if (!isAppReady) return
    const color = new THREE.Color().setHSL(
        Math.random(),
        Math.random(),
        Math.random()
    )
    drafter.materials.mesh.color = color
}

export function themeSelect(theme: string): boolean {
    const themeObject =
        constants.themes.objects[theme as keyof typeof constants.themes.objects]
    if (!themeObject) return false

    const newTheme = themeObject.display

    setSceneColor(newTheme.background)
    setMeshColor(newTheme.mesh.color)
    setMeshVisible(newTheme.mesh.visible)
    setLineColor(newTheme.line.color)
    setLineVisible(newTheme.line.visible)
    setDashColor(newTheme.dash.color)
    setDashVisible(newTheme.dash.visible)
    setProjectionColor(newTheme.projection.color)
    setProjectionVisible(newTheme.projection.visible)

    syncLevaDisplayControls(newTheme)

    return true
}
