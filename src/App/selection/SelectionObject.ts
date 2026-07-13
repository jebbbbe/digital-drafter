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

abstract class tmpBridge {
    abstract get kind(): SelectType

    abstract move(startHit: THREE.Vector3): unknown

    abstract getCenter(): THREE.Vector3

    abstract gizmoSetup(override: Partial<GizmoSettings>): void

    abstract panelSetup(override: Partial<PanelSettings>): void

    abstract gizmoListener(): void

    abstract delete(): void

    abstract setSelected(isSelected: boolean): void
}

export abstract class SelectionObject<TTarget> extends tmpBridge {
    target: TTarget

    constructor(target: TTarget) {
        super()
        this.target = target
    }
}

export abstract class InteractiveObject extends tmpBridge {
    constructor() {
        super()
    }
}
