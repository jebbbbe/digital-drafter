import * as THREE from "three"
import { drafter, scene, controllers } from "../AppContext"
import { settings, setTheme } from "../settings"
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

export function setGizmoColors(
    colors:
        | {
              xAxis: string
              yAxis: string
              zAxis: string
              active: string
          }
        | Record<string, string>
): void {
    const fallback = {
        xAxis: "#ff0000",
        yAxis: "#00ff00",
        zAxis: "#0000ff",
        active: "#ffff00",
    }
    const next = { ...fallback, ...colors }

    controllers.transformControls.setColors(
        next.xAxis,
        next.yAxis,
        next.zAxis,
        next.active
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
    if (!setTheme(theme)) return false

    const display = settings.display

    setSceneColor(display.background)
    setMeshColor(display.materials.mesh.color)
    setMeshVisible(display.objects.mesh.visible)
    setLineColor(display.materials.line.color)
    setLineVisible(display.objects.line.visible)
    setDashColor(display.materials.dash.color)
    setDashVisible(display.objects.dash.visible)
    setDashDashSize(display.materials.dash.dashSize)
    setDashGapSize(display.materials.dash.gapSize)
    setProjectionColor(display.materials.projection.color)
    setProjectionVisible(display.objects.projection.visible)
    setFoldColor(display.materials.fold.color)
    setFoldVisible(display.objects.fold.visible)
    setFoldDistance(display.materials.fold.foldDistance)
    setFoldSize(display.materials.fold.foldSize)
    setSectionColor(display.materials.sectionLine.color)

    syncLevaDisplayControls(display)
    setGizmoColors(display.gizmo)

    return true
}
