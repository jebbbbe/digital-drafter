import { Tool, type NormalizedPointerEvent } from "./Tool"
import type { AppContext } from "../../App/AppContext"
import {
    SegmentSelectionObject,
    NodeSelectionObject,
} from "../../App/interaction/SelectionObject"
import * as THREE from "three"
import type { NodeLocation } from "../../App/draft/TransformTree"

const startHit = new THREE.Vector3()

export class SelectTool extends Tool {
    constructor(ctx: AppContext) {
        super(ctx)
        console.log(ctx)
    }

    override onPointerDown(normalized: NormalizedPointerEvent) {
        const e = normalized.event
        const { drafter, raycastHelper, selection, interactionManager } =
            this.ctx

        // exit early for multiple touchs on mobile
        if (e.pointerType === "touch" && !e.isPrimary) return

        // if we clicked the gizmo, exit early so we can use it
        if (interactionManager.gizmoCLicked(e)) return

        //raycast to interactive objects in the scene
        const intersects = raycastHelper.castFromEvent(e)

        // nothing hit!
        if (intersects.length === 0) {
            if (e.shiftKey === false) {
                interactionManager.deSelectAll()
            }
            return
        }

        const first = intersects[0]
        // console.log(first)

        raycastHelper.castFromEventToPlane(e, startHit)
        if (!startHit) return

        //clear seleciton
        if (!e.shiftKey) {
            selection.clear()
        }
        let selectedObject // select obj ref
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
        const seen = selection.push(selectedObject)
        if (seen) return
        interactionManager.attachTransformControls(selectedObject)
        const moveFns = selectedObject.move(startHit)
        if (moveFns === undefined) return
        // prettier-ignore
        interactionManager.listeners.addActiveEvent("pointermove", "pointermove", moveFns.move)
        interactionManager.listeners.addActiveEvent(
            "pointerup",
            "pointerup",
            moveFns.up
        )
    }

    override onPointerMove(e: NormalizedPointerEvent): boolean {
        console.log("Dragging", e.event.clientX, e.event.clientY)
        return true
    }

    override onPointerUp(): boolean {
        console.log("Finish Move")
        return true
    }

    override cancel(): void {
        console.log("Move cancelled")
    }
}
