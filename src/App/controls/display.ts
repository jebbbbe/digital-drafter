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
        const instanceItem = drafter.getInstance(i)
        instanceItem.instances.mesh.visible = value
    }
}

export function setLineColor(value: string): void {
    drafter.materials.line.color.set(value)
    const len = drafter.instanceItems.length
    for (let i = 0; i < len; i++) {
        const instanceItem = drafter.getInstance(i)
        // @ts-ignore
        instanceItem.instances.line.material.color.set(value)
    }
}

export function setLineVisible(value: boolean): void {
    const len = drafter.instanceItems.length
    for (let i = 0; i < len; i++) {
        const instanceItem = drafter.getInstance(i)
        instanceItem.instances.line.visible = value
    }
}

export function setLineWidth(value: number): void {
    //set base material
    drafter.materials.line.linewidth = value

    //set clone materials
    const len = drafter.instanceItems.length
    for (let i = 0; i < len; i++) {
        const instanceItem = drafter.getInstance(i)
        // @ts-ignore
        instanceItem.instances.line.material.linewidth = value
    }
}

export function setDashColor(value: string): void {
    const len = drafter.instanceItems.length
    for (let i = 0; i < len; i++) {
        const instanceItem = drafter.getInstance(i)
        instanceItem.instances.dash.material.color.set(value)
    }
}

export function setDashVisible(value: boolean): void {
    const len = drafter.instanceItems.length
    for (let i = 0; i < len; i++) {
        const instanceItem = drafter.getInstance(i)
        instanceItem.instances.dash.visible = value
    }
}

export function setProjectionColor(value: string): void {
    const len = drafter.instanceItems.length
    for (let i = 0; i < len; i++) {
        const instanceItem = drafter.getInstance(i)
        instanceItem.instances.proj.material.color.set(value)
    }
}

export function setProjectionVisible(value: boolean): void {
    const len = drafter.instanceItems.length
    for (let i = 0; i < len; i++) {
        const instanceItem = drafter.getInstance(i)
        instanceItem.instances.proj.visible = value
    }
}

export function setDashDashSize(value: number): void {
    drafter.materials.dash.dashSize = value
}
export function setDashGapSize(value: number): void {
    drafter.materials.dash.gapSize = value
}

export function setFoldColor(value: string): void {
    drafter.materials.fold.color.set(value)
}
export function setFoldVisible(value: boolean): void {
    const len = drafter.instanceItems.length
    for (let i = 0; i < len; i++) {
        const instanceItem = drafter.getInstance(i)
        instanceItem.instances.fold.visible = value
    }
}
export function setFoldDistance(value: number): void {
    drafter.materials.fold.foldDistance = value
}
export function setFoldSize(value: number): void {
    drafter.materials.fold.foldSize = value
}

export function setSectionColor(value: string): void {
    drafter.materials.sectionLine.color.set(value)
}

export function setGizmoColors(colors: {
    xAxis: string
    yAxis: string
    zAxis: string
    active: string
}): void {
    interactionManager.controllers.transformControls.setColors(
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
    const themeObject = constants.themes[theme as keyof typeof constants.themes]
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
        setDashDashSize(newTheme.dash.dashSize)
        setDashGapSize(newTheme.dash.gapSize)
        setProjectionColor(newTheme.projection.color)
        setProjectionVisible(newTheme.projection.visible)
        setFoldColor(newTheme.fold.color)
        setFoldVisible(newTheme.fold.visible)
        setFoldDistance(newTheme.fold.foldDistance)
        setFoldSize(newTheme.fold.foldSize)
        setSectionColor(newTheme.section.color)

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
