import * as THREE from "three"
import { drafter, scene, interactionManager } from "../main"
import { constants } from "../constants"
import { syncLevaDisplayControls } from "../../components/Leva/LevaStore"

export function setSceneColor(value: string): void {
    ;(scene.background as THREE.Color).set(value)
}

export function setMeshColor(value: string): void {
    drafter.materials.mesh.color.set(value)
}

export function setMeshVisible(value: boolean): void {
    const len = drafter.instanceItems.length
    for (let i = 0; i < len; i++) {
        const instanceItem = drafter.instanceItems[i]
        if (!instanceItem) continue
        instanceItem.instances.mesh.visible = value
    }
}

export function setLineColor(value: string): void {
    // @ts-ignore
    drafter.materials.line.color.set(value)
    const len = drafter.instanceItems.length
    for (let i = 0; i < len; i++) {
        const instanceItem = drafter.instanceItems[i]
        if (!instanceItem) continue
        // @ts-ignore
        instanceItem.instances.line.material.color.set(value)
    }
}

export function setLineVisible(value: boolean): void {
    const len = drafter.instanceItems.length
    for (let i = 0; i < len; i++) {
        const instanceItem = drafter.instanceItems[i]
        if (!instanceItem) continue
        instanceItem.instances.line.visible = value
    }
}

export function setLineWidth(value: number): void {
    //set base material
    drafter.materials.line.linewidth = value

    //set clone materials
    const len = drafter.instanceItems.length
    for (let i = 0; i < len; i++) {
        const instanceItem = drafter.instanceItems[i]
        if (!instanceItem) continue
        // @ts-ignore
        instanceItem.instances.line.material.linewidth = value
    }
}

export function setDashColor(value: string): void {
    const len = drafter.instanceItems.length
    for (let i = 0; i < len; i++) {
        const instanceItem = drafter.instanceItems[i]
        if (!instanceItem) continue
        instanceItem.instances.dash.material.color.set(value)
    }
}

export function setDashVisible(value: boolean): void {
    const len = drafter.instanceItems.length
    for (let i = 0; i < len; i++) {
        const instanceItem = drafter.instanceItems[i]
        if (!instanceItem) continue
        instanceItem.instances.dash.visible = value
    }
}

export function setProjectionColor(value: string): void {
    const len = drafter.instanceItems.length
    for (let i = 0; i < len; i++) {
        const instanceItem = drafter.instanceItems[i]
        if (!instanceItem) continue
        instanceItem.instances.proj.material.color.set(value)
    }
}

export function setProjectionVisible(value: boolean): void {
    const len = drafter.instanceItems.length
    for (let i = 0; i < len; i++) {
        const instanceItem = drafter.instanceItems[i]
        if (!instanceItem) continue
        instanceItem.instances.proj.visible = value
    }
}

export function setDashDashSize(value: number): void {
    drafter.materials.dash.dashSize = value
}
export function setDashGapSize(value: number): void {
    drafter.materials.dash.gapSize = value
}

export function setGizmoColors(colors: {
    xAxis: string
    yAxis: string
    zAxis: string
    active: string
}): void {
    interactionManager.transformControls.setColors(
        colors.xAxis,
        colors.yAxis,
        colors.zAxis,
        colors.active
    )
}

export function randomizeMeshColor(): void {
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

    if ("display" in themeObject) {
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
    }
    if ("gizmo" in themeObject) {
        setGizmoColors(themeObject.gizmo)
    } else {
        setGizmoColors({
            xAxis: "#ff0000",
            yAxis: "#00ff00",
            zAxis: "#0000ff",
            active: "#ffff00",
        })
    }

    return true
}
