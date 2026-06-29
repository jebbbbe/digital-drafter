import * as THREE from "three"
import type { Drafter } from "../draft/Drafter"
import type { RaycastHelper } from "./RaycastHelper"
import type { SelectionManager, SelectObject } from "./selectionManager"
import type { ThreeControllersManager } from "./controllers"
import { ListenerManager } from "./ListenerManager"
import * as levaStore from "../../components/Leva/LevaStore"
import { handleKeyboardDown, handleKeyboardUp } from "../events/keyboard"
import { selectPointerDown } from "../events/events"

type InteractionManagerArgs = {
    domElement: HTMLCanvasElement
    drafter: Drafter
    raycastHelper: RaycastHelper
    selection: SelectionManager
    controllers: ThreeControllersManager
}

export class InteractionManager {
    drafter: Drafter
    raycastHelper: RaycastHelper
    selection: SelectionManager
    listeners: ListenerManager
    controllers: ThreeControllersManager
    constructor({
        domElement,
        drafter,
        raycastHelper,
        selection,
        controllers,
    }: InteractionManagerArgs) {
        this.drafter = drafter
        this.raycastHelper = raycastHelper
        this.selection = selection
        this.controllers = controllers

        this.listeners = new ListenerManager(domElement)
    }

    addEventListeners(): void {
        // prettier-ignore
        // this.listeners.addActiveEvent( "pointerDown", "pointerdown", selectPointerDown )
        // prettier-ignore
        this.listeners.addActiveEvent( "transformDraggingChanged", "dragging-changed", this.controllers.handleTransformDraggingChanged, this.controllers.transformControls )
        // prettier-ignore
        // this.listeners.addActiveEvent( "general.keydown", "keydown", handleKeyboardDown, window )
        // prettier-ignore
        // this.listeners.addActiveEvent( "general.keyup", "keyup", handleKeyboardUp, window )
    }

    dispose(): void {
        this.listeners.removeAllActiveEvents()
        this.controllers.dispose()
    }

    // Transform Controls
    attachTransformControls(object: SelectObject) {
        if (!this.controllers.useTransformControls) return

        object.gizmoSetup()
        this.controllers.attachTransformProxy()

        this.listeners.addActiveEvent(
            "transformObjectChange",
            "objectChange",
            () => object.gizmoListener(),
            this.controllers.transformControls
        )
    }

    detachTransformControls() {
        this.listeners.removeActiveEvent("transformObjectChange")
        this.controllers.detachTransformControls()
    }

    gizmoCLicked(e: PointerEvent): boolean {
        if (
            this.controllers.useTransformControls &&
            this.listeners.activeEvents["transformObjectChange"]
        ) {
            const gizmoHits = this.raycastHelper.castFromEvent(
                e,
                [this.controllers.transformControls.getHelper()],
                true
            )
            if (
                gizmoHits.length > 0 &&
                this.controllers.transformControls.axis
            ) {
                return true
            }
        }
        return false
    }

    deSelectAll() {
        // hide transform controls
        this.detachTransformControls()
        //clear selecction geo
        this.selection.clear()
        // detach leva
        levaStore.syncLevaDisplayStub({
            positionValue: { x: 0, z: 0 },
            rotateValue: { x: 0, y: 0 },
            scaleValue: 1.0,
        })
        levaStore.disableStub()
        // detach mouse events
        this.listeners.activeEvents["pointerup"]?.listener()
        // this.listeners.removeActiveEvent("pointerup")
        // this.listeners.removeActiveEvent("pointermove")
    }
}
