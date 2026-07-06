import * as THREE from "three"
import type { Mesh } from "three"

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

    abstract gizmoSetup(): void

    abstract gizmoListener(): void

    abstract delete(): void

    abstract setSelected(isSelected: boolean): void

    detach() {}

    detachChildren() {}
}
