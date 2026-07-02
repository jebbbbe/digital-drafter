import * as THREE from "three"
import { drafter, scene, controllers } from "../AppContext"
import { settings, setTheme } from "../settings"
import { syncLevaDisplayControls } from "../../components/Leva/LevaStore"
import type { SettingsMaterials } from "../themes/default"

type DisplayMaterials = {
    mesh: SettingsMaterials["mesh"]
    line: SettingsMaterials["line"]
    outline: SettingsMaterials["outline"]
    dash: SettingsMaterials["dash"]
    proj: SettingsMaterials["projection"]
    fold: SettingsMaterials["fold"]
}
type MaterialNames = keyof DisplayMaterials
type MaterialProp<M extends MaterialNames> = keyof DisplayMaterials[M]
type MaterialValue<
    M extends MaterialNames,
    P extends MaterialProp<M>,
> = DisplayMaterials[M][P]

function assignAllMaterials<M extends MaterialNames, P extends MaterialProp<M>>(
    materialName: M,
    materialProp: P,
    value: MaterialValue<M, P>
) {
    drafter.instanceItems.forEach((instanceItem) => {
        const material = instanceItem.instances[materialName].material as any
        material[materialProp] = value
    })
}

function setAllMaterials<M extends MaterialNames>(
    materialName: M,
    materialProp: "color",
    value: DisplayMaterials[M]["color"]
) {
    drafter.instanceItems.forEach((instanceItem) => {
        const material = instanceItem.instances[materialName].material as {
            color: THREE.Color
        }
        material[materialProp].set(value)
    })
}
export const setSceneColor = (value: string): void => {
    ;(scene.background as THREE.Color).set(value)
}

export const setMeshColor = (value: string): void =>
    setAllMaterials("mesh", "color", value)

export const setMeshOpacity = (value: number): void => {
    assignAllMaterials("mesh", "opacity", value)
    assignAllMaterials("mesh", "transparent", value < 1)
}

export function setMeshVisible(value: boolean): void {
    drafter.instanceItems.forEach((instanceItem) => {
        instanceItem.instances.mesh.visible = value
    })
}

export const setLineColor = (value: string): void =>
    setAllMaterials("line", "color", value)

export const setLineOpacity = (value: number): void => {
    assignAllMaterials("line", "opacity", value)
    assignAllMaterials("line", "transparent", value < 1)
}

export function setLineVisible(value: boolean): void {
    drafter.instanceItems.forEach((instanceItem) => {
        instanceItem.instances.line.visible = value
    })
}

export const setLineWidth = (value: number): void =>
    assignAllMaterials("line", "linewidth", value)

export const setOutlineColor = (value: string): void =>
    setAllMaterials("outline", "color", value)

export const setOutlineOpacity = (value: number): void => {
    assignAllMaterials("outline", "opacity", value)
    assignAllMaterials("outline", "transparent", value < 1)
}

export const setOutlineWidth = (value: number): void =>
    assignAllMaterials("outline", "linewidth", value)

export const setDashColor = (value: string): void =>
    setAllMaterials("dash", "color", value)

export const setDashOpacity = (value: number): void => {
    assignAllMaterials("dash", "opacity", value)
    assignAllMaterials("dash", "transparent", value < 1)
}

export const setDashLineWidth = (value: number): void =>
    assignAllMaterials("dash", "linewidth", value)

export function setDashVisible(value: boolean): void {
    drafter.instanceItems.forEach((instanceItem) => {
        instanceItem.instances.dash.visible = value
    })
}

export const setProjectionColor = (value: string): void =>
    setAllMaterials("proj", "color", value)

export const setProjectionOpacity = (value: number): void => {
    assignAllMaterials("proj", "opacity", value)
    assignAllMaterials("proj", "transparent", value < 1)
}

export const setProjectionLineWidth = (value: number): void =>
    assignAllMaterials("proj", "linewidth", value)

export function setProjectionVisible(value: boolean): void {
    drafter.instanceItems.forEach((instanceItem) => {
        instanceItem.instances.proj.visible = value
    })
}

export const setDashDashSize = (value: number): void =>
    assignAllMaterials("dash", "dashSize", value)

export const setDashGapSize = (value: number): void =>
    assignAllMaterials("dash", "gapSize", value)

export const setFoldColor = (value: string): void =>
    setAllMaterials("fold", "color", value)

export const setFoldOpacity = (value: number): void => {
    assignAllMaterials("fold", "opacity", value)
    assignAllMaterials("fold", "transparent", value < 1)
}

export const setFoldLineWidth = (value: number): void =>
    assignAllMaterials("fold", "linewidth", value)

export const setFoldDistance = (value: number): void =>
    assignAllMaterials("fold", "foldDistance", value)

export const setFoldSize = (value: number): void =>
    assignAllMaterials("fold", "foldSize", value)

export function setFoldVisible(value: boolean): void {
    drafter.instanceItems.forEach((instanceItem) => {
        instanceItem.instances.fold.visible = value
    })
}

export const setSectionColor = (value: string): void => {
    drafter.materials.sectionLine.color.set(value)
}

export const setSectionFaceColor = (value: string): void => {
    drafter.materials.sectionFace.color.set(value)
}

export const setSectionFaceOpacity = (value: number): void => {
    drafter.materials.sectionFace.opacity = value
    drafter.materials.sectionFace.transparent = value < 1
}

export const setSectionEdgeColor = (value: string): void => {
    drafter.materials.sectionEdge.color.set(value)
}

export const setSectionEdgeOpacity = (value: number): void => {
    drafter.materials.sectionEdge.opacity = value
    drafter.materials.sectionEdge.transparent = value < 1
}

export const setSectionEdgeWidth = (value: number): void => {
    drafter.materials.sectionEdge.linewidth = value
}

export const setSectionLineOpacity = (value: number): void => {
    drafter.materials.sectionLine.opacity = value
    drafter.materials.sectionLine.transparent = value < 1
}

export const setSectionLineWidth = (value: number): void => {
    drafter.materials.sectionLine.linewidth = value
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
    // setMeshOpacity(display.materials.mesh.opacity)
    // setMeshVisible(display.objects.mesh.visible)
    setLineColor(display.materials.line.color)
    // setLineOpacity(display.materials.line.opacity)
    // setLineVisible(display.objects.line.visible)
    setLineWidth(display.materials.line.linewidth)
    setOutlineColor(display.materials.outline.color)
    // setOutlineOpacity(display.materials.outline.opacity)
    setOutlineWidth(display.materials.outline.linewidth)
    setDashColor(display.materials.dash.color)
    // setDashOpacity(display.materials.dash.opacity)
    // setDashVisible(display.objects.dash.visible)
    setDashDashSize(display.materials.dash.dashSize)
    setDashGapSize(display.materials.dash.gapSize)
    setProjectionColor(display.materials.projection.color)
    // setProjectionOpacity(display.materials.projection.opacity)
    // setProjectionVisible(display.objects.projection.visible)
    setProjectionLineWidth(display.materials.projection.linewidth)
    setFoldColor(display.materials.fold.color)
    // setFoldOpacity(display.materials.fold.opacity)
    // setFoldVisible(display.objects.fold.visible)
    setFoldLineWidth(display.materials.fold.linewidth)
    setFoldDistance(display.materials.fold.foldDistance)
    setFoldSize(display.materials.fold.foldSize)
    setSectionColor(display.materials.sectionLine.color)
    // setSectionLineOpacity(display.materials.sectionLine.opacity)
    setSectionLineWidth(display.materials.sectionLine.linewidth)

    setSectionFaceColor(display.materials.sectionFace.color)
    // setSectionFaceOpacity(display.materials.sectionFace.opacity)
    setSectionEdgeColor(display.materials.sectionEdge.color)
    // setSectionEdgeOpacity(display.materials.sectionEdge.opacity)
    setSectionEdgeWidth(display.materials.sectionEdge.linewidth)

    syncLevaDisplayControls(display)
    setGizmoColors(display.gizmo)

    return true
}
