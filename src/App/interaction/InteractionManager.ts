import * as THREE from "three"
import type { Drafter } from "../draft/Drafter"
import type { RaycastHelper } from "./RaycastHelper"
import type { SelectionManager, SelectObject } from "./selectionManager"
import type { ThreeControllersManager } from "./controllers"
import { ListenerManager } from "./ListenerManager"
import * as levaStore from "../../components/Leva/LevaStore"

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
        this.listeners.addActiveEvent( "transformDraggingChanged", "dragging-changed", this.controllers.handleTransformDraggingChanged, this.controllers.transformControls )

        this.listeners.addActiveEvent(
            "transformObjectChange",
            "objectChange",
            () => this.selection.transformCallback(),
            this.controllers.transformControls
        )
    }

    dispose(): void {
        this.listeners.removeAllActiveEvents()
        this.controllers.dispose()
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
        this.controllers.detachTransformControls()
        //clear selecction geo
        this.selection.clear()
        // detach leva
        levaStore.syncLevaDisplayStub({
            positionValue: { x: 0, z: 0 },
            rotateValue: { x: 0, y: 0 },
            scaleValue: 1.0,
        })
        levaStore.disableStub()
    }
}
