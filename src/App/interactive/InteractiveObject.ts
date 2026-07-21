import * as THREE from "three"
import type { GizmoSettings, PanelSettings } from "@types"

export abstract class InteractiveObject {
    selected = false

    abstract move(startHit: THREE.Vector3): unknown

    abstract getCenter(): THREE.Vector3

    abstract gizmoSetup(override: Partial<GizmoSettings>): void

    abstract panelSetup(override: Partial<PanelSettings>): void

    abstract gizmoListener(position?: THREE.Vector3): void

    abstract delete(): void

    abstract setSelected(isSelected: boolean): void
}
