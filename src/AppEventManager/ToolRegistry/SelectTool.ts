import {
    Interaction,
    InteractiveTool,
    type NormalizedPointerEvent,
} from "./Tool"
import type { AppContext } from "../../App/AppContext"
import {
    SegmentSelectionObject,
    NodeSelectionObject,
} from "../../App/interaction/SelectionObject"
import * as THREE from "three"
import type { NodeLocation } from "../../App/draft/TransformTree"

const startHit = new THREE.Vector3()

type MoveHandlers = {
    move: (event: PointerEvent) => void
    up: () => void
}

class SelectionMoveInteraction extends Interaction {
    private finished = false
    private moveHandlers: MoveHandlers

    constructor(ctx: AppContext, moveHandlers: MoveHandlers) {
        super(ctx)
        this.moveHandlers = moveHandlers
    }

    override onPointerMove(event: NormalizedPointerEvent): boolean {
        if (this.finished) return false

        this.moveHandlers.move(event.event)
        return true
    }

    override onPointerUp(): boolean {
        if (this.finished) return false

        this.finished = true
        this.moveHandlers.up()
        return true
    }

    override cancel(): void {
        if (this.finished) return

        this.finished = true
        this.moveHandlers.up()
    }
}

export class SelectTool extends InteractiveTool {
    override onPointerDown(normalized: NormalizedPointerEvent) {
        const e = normalized.event
        const {
            drafter,
            raycastHelper,
            selection,
            interactionManager,
            controllers,
        } = this.ctx

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

        const hit = raycastHelper.castFromEventToPlane(e, startHit)
        if (!hit) return

        //clear seleciton
        if (!e.shiftKey) {
            selection.clear()
        }

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
        const seen = selection.push(selectedObject)
        if (seen) return

		
        if (controllers.useTransformControls) {
            selectedObject.gizmoSetup()
            controllers.attachTransformProxy()
        }

        this.cancel()

        const moveFns = selectedObject.move(startHit) as
            | MoveHandlers
            | undefined
        if (moveFns === undefined) return

        this.startInteraction(
            new SelectionMoveInteraction(this.ctx, moveFns),
            normalized
        )
    }

    override onKeyDown(event: KeyboardEvent): boolean {
        if (event.key !== "Escape" || !this.interaction) return false

        this.cancel()
        this.ctx.interactionManager.deSelectAll()
        return true
    }
}
