import * as THREE from "three"
import type { GizmoSettings, PanelSettings } from "@types"
import type { Constraints } from "../../AppEventManager/ToolRegistry/constrain"

export abstract class Attachment {
    selected = false

    abstract delete(): void

    abstract setSelected(isSelected: boolean): void
}

export abstract class InteractiveObject extends Attachment {
    defaultConstraint: Constraints = "none"

    abstract move(delta: THREE.Vector3): void

    abstract setPosition(position: THREE.Vector3): void

    moveFromSelection(delta: THREE.Vector3): void {
        this.move(delta)
    }

    getConstraintDirection(): THREE.Vector3 {
        return new THREE.Vector3()
    }

    abstract getCenter(): THREE.Vector3

    abstract gizmoSetup(override: Partial<GizmoSettings>): void

    abstract panelSetup(override: Partial<PanelSettings>): void

    abstract gizmoListener(position?: THREE.Vector3): void
}
