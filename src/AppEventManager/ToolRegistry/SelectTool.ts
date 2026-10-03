import { Tool, type NormalizedPointerEvent } from "./Tool"
import * as THREE from "three"
import type { NodeLocation } from "@types"
import { deSelectAll } from "../../App/controls/interaction"
import { NEWSectionCutter } from "../../App/interactive/sl"
import { SectionCutterInstance } from "../../App/interactive/SectionCutterInstance"
import { SectionCutter, TransformNode } from "../../App/interactive"

const startHit = new THREE.Vector3()
const _zeroVec3 = new THREE.Vector3()
const _zeroQuaternion = new THREE.Quaternion()

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
        const {
            drafter,
            sectionCutter,
            raycastHelper,
            selection,
            controllers,
        } = this.ctx

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

        let selectedObject:
            | TransformNode
            | SectionCutter
            | SectionCutterInstance
        const instanceCutter = first.object.userData.sectionCutter
        if (instanceCutter instanceof NEWSectionCutter) {
            if (first.instanceId === undefined) return
            const instance = instanceCutter.instances[first.instanceId]
            if (!instance) return
            selectedObject = instance
        } else if (first.object === sectionCutter.mesh) {
            selectedObject = sectionCutter
        } else {
            // find node from raycast
            const id = first.object.userData.id
            const index = first.instanceId
            const location = { id, index }

            // add node to selection
            const node = drafter.findNode(location as NodeLocation)
            if (!node) return
            selectedObject = node
        }

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

        if (selection.size === 0) {
            deSelectAll()
            return
        }

        if (added) {
            controllers.attachTransformProxy()
        }
        console.log(selectedObject)
        this.linkPanel()
        this.linkGizmo()

        if (removed) {
            return
        } else if (
            selection.size > 1 ||
            selectedObject instanceof SectionCutter ||
            selectedObject instanceof SectionCutterInstance
        ) {
            console.log(hit)
            this.eventManager.setTool("moveSelection", hit)
        } else if (selectedObject instanceof TransformNode) {
            this.eventManager.setTool("moveNode", selectedObject, hit)
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
