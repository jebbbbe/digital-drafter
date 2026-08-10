import * as THREE from "three"
import type { GizmoSettings, PanelSettings } from "@types"

export abstract class Attachment {
    selected = false

    abstract delete(): void

    abstract setSelected(isSelected: boolean): void
}

export abstract class InteractiveObject extends Attachment {
    abstract move(startHit: THREE.Vector3): unknown

    abstract getCenter(): THREE.Vector3

    abstract gizmoSetup(override: Partial<GizmoSettings>): void

    abstract panelSetup(override: Partial<PanelSettings>): void

    abstract gizmoListener(position?: THREE.Vector3): void
}
