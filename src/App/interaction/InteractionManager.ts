import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/Addons.js"
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js"
import { Drafter } from "../draft/Drafter"
import type { TransformNode } from "../draft/TransformNode"
import type { NodeLocation } from "../draft/TransformTree"
import { createsCycle } from "../draft/recursive"
import { RaycastHelper } from "./RaycastHelper"
import {
    enableStub,
    disableStub,
    enableLeafStub,
    enableRootStub,
    disableLeafStub,
    disableRootStub,
    syncLevaDisplayStub,
} from "../../components/Leva/LevaStore"
import { controls } from "../controls/controls"

type InteractionManagerArgs = {
    camera: THREE.Camera
    scene: THREE.Scene
    domElement: HTMLCanvasElement
    orbitControls: OrbitControls
    drafter: Drafter
    targets?: THREE.Object3D[]
}

type ActiveEvent = {
    target: HTMLCanvasElement | TransformControls | Window
    type: string
    listener: Function
}

export class InteractionManager {
    domElement: HTMLCanvasElement
    scene: THREE.Scene
    drafter: Drafter
    raycastHelper: RaycastHelper
    orbitControls: OrbitControls
    transformControls: TransformControls
    transformControlsEnabled = true
    transformProxy = new THREE.Object3D()
    activeEvents: Partial<Record<string, ActiveEvent>> = {}
    selection: TransformNode[] = []
    levaStubEnabled = false
    constructor({
        camera,
        scene,
        domElement,
        orbitControls,
        drafter,
        targets = drafter.interactivObjects,
    }: InteractionManagerArgs) {
        this.scene = scene
        this.domElement = domElement
        this.orbitControls = orbitControls
        this.drafter = drafter
        this.raycastHelper = new RaycastHelper(camera, targets, domElement)

        this.transformControls = new TransformControls(camera, domElement)
        this.transformControls.setMode("translate")
        this.transformControls.showY = false
        this.transformControls.translationSnap = 0.25

        this.scene.add(this.transformProxy)
        this.scene.add(this.transformControls.getHelper())
    }

    addEventListeners(): void {
        this.addActiveEvent(
            "pointerDown",
            "pointerdown",
            this.handlePointerDown
        )
        this.addActiveEvent(
            "transformDraggingChanged",
            "dragging-changed",
            this.handleTransformDraggingChanged,
            this.transformControls
        )
    }

    dispose(): void {
        this.removeAllActiveEvents()
        this.transformControls.detach()
        this.scene.remove(this.transformProxy)
        this.scene.remove(this.transformControls.getHelper())
    }

    addActiveEvent(
        name: string,
        type: string,
        listener: Function,
        target: HTMLCanvasElement | TransformControls | Window = this.domElement
    ) {
        this.removeActiveEvent(name)
        ;(target as any).addEventListener(type, listener)
        const event = { target, type, listener } as ActiveEvent
        this.activeEvents[name] = event
        return event
    }

    removeActiveEvent(name: string) {
        const event = this.activeEvents[name]
        if (!event) return
        ;(event.target as any).removeEventListener(event.type, event.listener)
        delete this.activeEvents[name]
    }

    removeAllActiveEvents() {
        for (const name in this.activeEvents) {
            this.removeActiveEvent(name)
        }
    }

    handlePointerDown = (e: PointerEvent): void => {
        // exit early for multiple touchs on mobile
        if (e.pointerType === "touch" && !e.isPrimary) return

        // if we clicked the gizmo, exit early so we can use it
        if (
            this.transformControlsEnabled &&
            this.activeEvents.transformObjectChange
        ) {
            const gizmoHits = this.raycastHelper.castFromEvent(
                e,
                [this.transformControls.getHelper()],
                true
            )
            if (gizmoHits.length > 0 && this.transformControls.axis) {
                return
            }
        }

        //disable leva UI
        if (this.levaStubEnabled) {
            this.levaStubEnabled = false
            syncLevaDisplayStub({
                positionValue: { x: 0, z: 0 },
                rotateValue: { x: 0, y: 0 },
                scaleValue: 1.0,
            })
            disableStub()
        }

        //raycast to interacctive objects in the scene
        const intersects = this.raycastHelper.castFromEvent(e)

        // detach transform controls unles in use
        if (intersects.length === 0) {
            if (
                !this.transformControlsEnabled ||
                (!this.transformControls.dragging &&
                    !this.transformControls.axis)
            ) {
                this.detachTransformControls()
            }
            // remove previous seleciton
            this.selection.length = 0
            return
        }

        // log intersects and return
        if (intersects[0].object === this.drafter.sectionCutter.mesh) {
            console.log(intersects)
            return
            // intersects.shift() 
        }

        // find node from raycast
        const int = intersects[0]
        const id = int.object.userData.id
        const index = int.instanceId
        const location = { id, index } as NodeLocation
        // prettier-ignore
        const node = this.drafter.tree.findNode(location) as  TransformNode | undefined
        if (!node) return

        // add new selection
        this.selection.length = 0
        this.selection.push(node)

        // enable ui buttons
        // enableStub()
        const isRoot = node === node.parent

        // set leva panel values
        syncLevaDisplayStub(controls.getNodevalues(node))

        if (isRoot) {
            enableRootStub()
            this.levaStubEnabled = true
        } else {
            enableLeafStub()
            this.levaStubEnabled = true
        }

        // attach transform controls
        if (this.transformControlsEnabled) {
            this.attachTransformControls(node)
        }

        // console.log(intersects)
        // console.log(int)
        // console.log(location)
        // console.log(node)

        //raycast to plane
        const startHit = this.raycastHelper.castFromEventToPlane(e)
        const moveOffset = startHit
            ? new THREE.Vector3().subVectors(node.position, startHit)
            : new THREE.Vector3()

        // attach events
        this.attachNodeMove(moveOffset)
        this.attachAddNodeKey()
        this.attachDeleteNodeKey()
    }

    handleTransformDraggingChanged = (e: { value: unknown }) => {
        this.orbitControls.enabled = !Boolean(e.value)
    }
    attachTransformControls(node: TransformNode) {
        this.removeActiveEvent("transformObjectChange")

        this.transformProxy.position.copy(node.position)
        this.transformProxy.rotation.set(0, 0, 0)
        this.transformProxy.scale.set(1, 1, 1)
        this.transformProxy.updateMatrixWorld(true)
        const handleObjectChange = () => {
            node.position.copy(this.transformProxy.position)
            this.drafter.updatePatchedNode(node)
        }
        this.addActiveEvent(
            "transformObjectChange",
            "objectChange",
            handleObjectChange,
            this.transformControls
        )
        this.transformControls.attach(this.transformProxy)
    }
    detachTransformControls() {
        this.removeActiveEvent("transformObjectChange")
        this.removeActiveEvent("deleteKey.keyDown")
        this.transformControls.detach()
        this.orbitControls.enabled = true
    }

    attachNodeMove(startOffset: THREE.Vector3) {
        const node = this.selection[0]
        this.orbitControls.enabled = false
        const prevEnableTransform = this.transformControls.enabled
        this.transformControls.enabled = false

        const handlePointerMove = (moveEvent: PointerEvent) => {
            const hit = this.raycastHelper.castFromEventToPlane(moveEvent)
            if (!hit) return

            node.position.copy(hit).add(startOffset)
            this.drafter.updatePatchedNode(node)

            if (this.transformControlsEnabled) {
                this.transformProxy.position.copy(node.position)
                this.transformProxy.updateMatrixWorld(true)
            }
        }

        const handlePointerUp = () => {
            this.removeActiveEvent("moveNode.pointerMove")
            this.removeActiveEvent("moveNode.pointerUp")
            this.orbitControls.enabled = true
            this.transformControls.enabled = prevEnableTransform
        }

        // prettier-ignore
        this.addActiveEvent("moveNode.pointerMove", "pointermove", handlePointerMove)
        this.addActiveEvent("moveNode.pointerUp", "pointerup", handlePointerUp)
    }
    attachAddNodeKey() {
        // when holding the key, add node up to 20 times
        const maxHOLD = 20
        let currHold = 0
        const handleKeyDown = (keyEvent: KeyboardEvent) => {
            if (keyEvent.key !== " ") return
            // if (keyEvent.repeat) return
            if (currHold > maxHOLD) return
            currHold++
            controls.addLeafNearbyRandomlyFromSelection()
        }
        const handleKeyUp = (keyEvent: KeyboardEvent) => {
            if (keyEvent.key !== " ") return
            currHold = 0
        }

        // prettier-ignore
        this.addActiveEvent( "deleteNodeKey.keydown", "keydown", handleKeyDown, window )
        this.addActiveEvent("deleteNodeKey.keyup", "keyup", handleKeyUp, window)
    }
    attachDeleteNodeKey() {
        const handleKeyDown = (keyEvent: KeyboardEvent) => {
            if (keyEvent.key !== "Delete") return
            if (keyEvent.repeat) return
            controls.pruneNodeFromSelection()
        }
        // prettier-ignore
        this.addActiveEvent( "addNodeKey.keydown", "keydown", handleKeyDown, window )
    }
    // now called from controls for external update
    onPruneNode() {
        // as method so can be called from LEVA on delete.
        // call handlePointerUp
        this.activeEvents["moveNode.pointerUp"]?.listener()
        // cremove this listneer
        this.removeActiveEvent("deleteKey.keyDown")
        // detach transform from seleccted
        this.detachTransformControls()
        // remove selected
        this.selection.length = 0
    }
}
