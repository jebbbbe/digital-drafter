type Material = {
    color: string
    opacity: number
    transparent?: boolean
}

type LineMaterial = Material & {
    linewidth: number
    dashed: boolean
    dashSize: number
    gapSize: number
}

type FoldMaterial = LineMaterial & {
    foldSize: number
    foldDistance: number
}

export type SettingsMaterials = {
    mesh: Material
    line: LineMaterial
    dash: LineMaterial
    projection: LineMaterial
    fold: FoldMaterial
    sectionLine: LineMaterial
    outline: LineMaterial
    sectionFace: Material
    sectionEdge: LineMaterial
}

export type SettingsObjects = {
    mesh: Record<string, any>
    line: Record<string, any>
    dash: Record<string, any>
    projection: Record<string, any>
    fold: Record<string, any>
    sectionLine: Record<string, any>
    outline: Record<string, any>
    sectionFace: Record<string, any>
    sectionEdge: Record<string, any>
}

export type SettingsDisplay = {
    theme: string
    background: string
    materials: SettingsMaterials
    objects: SettingsObjects
    leva: Record<string, any>
    gizmo: Record<string, any>
}

export type Settings = {
    camera: {
        rotationEnabled: boolean
        zoom: number
        position: [number, number, number]
    }
    display: SettingsDisplay
}

export type NodeLocation = {
    id: number
    index: number
}

export type { GizmoPreset, GizmoSettings } from "./App/selection/ThreeControllersManager"
export type { PanelSettings } from "./components/Leva/LevaStore"
export type {
    InteractiveObject,
    SegmentAttachment,
    TransformNode,
} from "./App/interactive"
export type { SectionAttachment } from "./App/interactive"
export type { SectionCutter, SectionFaceGroup } from "./App/objects/attachments"
