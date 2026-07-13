import { Tool, type NormalizedPointerEvent } from "./Tool"
import {
    SegmentSelectionObject,
    NodeSelectionObject,
} from "../../App/selection"
import * as THREE from "three"
import type { NodeLocation } from "../../App/draft/TransformTree"
import { deSelectAll } from "../../App/controls/interaction"

import type { GizmoSettings } from "../../App/selection/ThreeControllersManager"
import type { PanelSettings } from "../../components/Leva/LevaStore"

const startHit = new THREE.Vector3()

const _zeroVec3 = new THREE.Vector3()
const _zeroQuaternion = new THREE.Quaternion()

export class SelectTool extends Tool {
    override onPointerDown(_normalized: NormalizedPointerEvent) {
        const e = _normalized.event
        const { drafter, raycastHelper, selection, controllers } = this.ctx

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

        // create selectedObject from type
        let selectedObject: NodeSelectionObject | SegmentSelectionObject
        if (first.object === drafter.sectionCutter.mesh) {
            // hit section cutter
            const { index, faceIndex, object }: any = intersects[0]
            selectedObject = new SegmentSelectionObject({
                object,
                // for gl_line or LineMaterial
                index: index ?? faceIndex * 2,
            })
        } else {
            // find node from raycast
            const id = first.object.userData.id
            const index = first.instanceId
            const location = { id, index }

            // add node to selection
            const node = drafter.findNode(location as NodeLocation)
            if (!node) return

            selectedObject = new NodeSelectionObject(node)
        }
		
        console.log(selectedObject)

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

        this.linkPanel()
        this.linkGizmo()

        if (removed) {
            return
        } else if (selection.size > 1) {
            console.log(hit)
            this.eventManager.setTool("moveSelection", hit)
        } else if (selectedObject instanceof NodeSelectionObject) {
            this.eventManager.setTool("moveNode", selectedObject.target, hit)
        } else if (selectedObject instanceof SegmentSelectionObject) {
            this.eventManager.setTool("moveSegment", selectedObject.target, hit)
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
