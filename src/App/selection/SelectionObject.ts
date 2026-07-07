import * as THREE from "three"
import type { Mesh } from "three"
import type { GizmoSettings } from "./ThreeControllersManager"
import type { PanelSettings } from "../../components/Leva/LevaStore"

export type SectionSegment = {
    object: Mesh
    index: number
}

export type SelectType =
    | "SectionSegment"
    | "leaf"
    | "root"
    | "sectionChild"
    | "sectionParent"

export abstract class SelectionObject<TTarget> {
    target: TTarget

    constructor(target: TTarget) {
        this.target = target
    }

    abstract get kind(): SelectType

    abstract move(startHit: THREE.Vector3): unknown

    abstract getCenter(): THREE.Vector3

    abstract gizmoSetup(override: Partial<GizmoSettings>): void

    abstract panelSetup(override: Partial<PanelSettings>): void

    abstract gizmoListener(): void

    abstract delete(): void

    abstract setSelected(isSelected: boolean): void
}
