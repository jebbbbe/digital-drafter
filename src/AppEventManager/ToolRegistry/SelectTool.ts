import { Tool, type NormalizedPointerEvent } from "./Tool"
import * as THREE from "three"
import { deSelectAll } from "../../App/controls/interaction"
import { getInteractiveObject } from "../../App/interactive"

const startHit = new THREE.Vector3()

export class SelectTool extends Tool {
    override enter(..._args: unknown[]): void {
        //this is the default tool so we can set this false here
        this.eventManager.asyncToolActive = false

        const { selection, controllers } = this.ctx
        if (selection.size === 0) return

        controllers.attachTransformProxy()
        this.linkGizmo()
        this.linkPanel()
    }
    override onPointerDown(_normalized: NormalizedPointerEvent) {
        const e = _normalized.event
        const { raycastHelper, selection, controllers } = this.ctx

        // right click is for orbit controls
        if (e.button === 2) {
            return
        }

        // exit early for multiple touchs on mobile
        if (e.pointerType === "touch" && !e.isPrimary) return

        // if we clicked the gizmo, exit early so we can use it
        if (this.gizmoClicked(e)) return

        //raycast to interactive objects in the scene
        const intersects = raycastHelper.castFromEvent(e)

        // nothing hit!
        if (intersects.length === 0) {
            if (!e.shiftKey && !e.ctrlKey) {
                deSelectAll()
            }
            return
        }

        const first = intersects[0]

        const hit = raycastHelper.castFromEventToPlane(e, startHit)
        if (!hit) return

        const selectedObject = getInteractiveObject(first, this.ctx)
        if (!selectedObject) return

        let removed = false
        let added = false
        let has = selection.has(selectedObject)

        //clear selction
        if (!has) {
            if (!e.shiftKey && !e.ctrlKey) {
                selection.clear()
            }
        }

        if (e.ctrlKey) {
            removed = selection.remove(selectedObject)
        } else {
            added = selection.add(selectedObject)
        }

        if (added) {
            controllers.attachTransformProxy()
        }
        console.log(selectedObject)
        this.linkPanel()
        this.linkGizmo()

        if (removed) {
            return
        } else if (selection.size > 1) {
            console.log(hit)
            this.eventManager.setTool("moveSelection", hit)
        } else {
            this.eventManager.setTool("move", selectedObject, hit)
        }
    }

    gizmoClicked(e: PointerEvent): boolean {
        const { controllers, selection, raycastHelper } = this.ctx
        if (controllers.useTransformControls && selection.size > 0) {
            const gizmoHits = raycastHelper.castFromEvent(
                e,
                [controllers.transformControls.getHelper()],
                true
            )
            if (gizmoHits.length > 0 && controllers.transformControls.axis) {
                return true
            }
        }
        return false
    }
}
