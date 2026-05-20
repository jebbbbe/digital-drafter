import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/Addons.js"
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js"
import { Drafter } from "../draft/Drafter"
import type { TransformNode } from "../draft/TransformNode"
import type { NodeLocation } from "../draft/TransformTree"
import { createsCycle } from "../draft/recursive"
import {
    getSlotIndex,
    getNodeLocationFromSlot,
} from "../objects/textures/GlobalTreeTexture"
import { RaycastHelper } from "./RaycastHelper"
import {
    disableStub,
    enableLeafStub,
    enableRootStub,
    syncLevaDisplayStub,
    setLevaInsertDefault,
} from "../../components/Leva/LevaStore"
import { controls } from "../controls/controls"

import { SelectionManager } from "./selectionManager"
import type { SelectObject } from "./selectionManager"

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

const _prevPosition = new THREE.Vector3()
const _delta = new THREE.Vector3()
const _zero = new THREE.Vector3()

const spaceHoldMax = 20
let spaceHoldCurr = 0

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
    selection: SelectionManager
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

        this.selection = new SelectionManager(drafter)
    }

    // Listeners
    addEventListeners(): void {
        // prettier-ignore
        this.addActiveEvent( "pointerDown", "pointerdown", this.handlePointerDown )
        // prettier-ignore
        this.addActiveEvent( "transformDraggingChanged", "dragging-changed", this.handleTransformDraggingChanged, this.transformControls )
        // prettier-ignore
        this.addActiveEvent( "general.keydown", "keydown", this.handleKeyboardDown, window )
        // prettier-ignore
        this.addActiveEvent( "general.keyup", "keyup", this.handleKeyboardUp, window )
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

    // Transform Controls
    handleTransformDraggingChanged = (e: { value: unknown }) => {
        this.orbitControls.enabled = !Boolean(e.value)
    }
    attachTransformControls(node: TransformNode) {
        this.removeActiveEvent("transformObjectChange")
        const slotIndex = getSlotIndex(node.location)

        this.transformProxy.position.copy(node.position)
        this.transformProxy.rotation.set(0, 0, 0)
        this.transformProxy.scale.set(1, 1, 1)
        this.transformProxy.updateMatrixWorld(true)

        const handleObjectChange = () => {
            _prevPosition.copy(node.position)
            node.position.copy(this.transformProxy.position)
            _delta.subVectors(node.position, _prevPosition)
            if (_delta.lengthSq() === 0) return

            this.drafter.sectionCutter.moveFromNodeSlot(
                _delta,
                _delta,
                slotIndex
            )
            this.drafter.updatePatchedNode(node)
            syncLevaDisplayStub(controls.getNodevalues(node))
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
        this.removeActiveEvent("delete.keydown")
        this.removeActiveEvent("space.keydown")
        this.removeActiveEvent("space.keyup")
        this.transformControls.detach()
        this.orbitControls.enabled = true
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

        // detach transform controls unless in use
        if (intersects.length === 0) {
            if (
                !this.transformControlsEnabled ||
                (!this.transformControls.dragging &&
                    !this.transformControls.axis)
            ) {
                this.detachTransformControls()
            }
            // remove previous seleciton
            this.selection.clear()
        } else if (intersects[0].object === this.drafter.sectionCutter.mesh) {
            console.log(intersects[0])
            const { point, index, object }: any = intersects[0]
            point.y = 0 // force for distance

            const start = new THREE.Vector3()
            const end = new THREE.Vector3()
            this.drafter.sectionCutter.getSegmentAsVector(index, start, end)

            const totalDist = start.distanceToSquared(end)
            const threshold = totalDist / 16
            let mode: "start" | "end" | "both" = "both"
            if (point.distanceToSquared(start) <= threshold) {
                mode = "start"
            } else if (point.distanceToSquared(end) <= threshold) {
                mode = "end"
            }

            const startHit = this.raycastHelper.castFromEventToPlane(e)
            if (!startHit) return

            this.selection.clear()
            this.selection.push({
                type: "SectionSegment",
                target: { object, index },
            } as SelectObject)

            this.detachTransformControls()
            this.attachSegmentMoveKey(startHit, mode)
            this.removeActiveEvent("space.keydown")
            this.removeActiveEvent("space.keyup")
        } else {
            // find node from raycast
            const int = intersects[0]
            const id = int.object.userData.id
            const index = int.instanceId
            const location = { id, index } as NodeLocation
            // prettier-ignore
            const node = this.drafter.tree.findNode(location) as  TransformNode | undefined
            if (!node) return

            // add new selection
            this.selection.clear()
            this.selection.push({
                type: "TransformNode",
                target: node,
            })

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
        }
    }

    //events
    attachNodeMove(startOffset: THREE.Vector3) {
        const node = this.selection.firstTarget("TransformNode")
        if (!node) return
        const slotIndex = getSlotIndex(node.location)
        this.orbitControls.enabled = false
        const prevEnableTransform = this.transformControls.enabled
        this.transformControls.enabled = false

        const handlePointerMove = (moveEvent: PointerEvent) => {
            // get xz pos
            const hit = this.raycastHelper.castFromEventToPlane(moveEvent)
            if (!hit) return

            // add offset to pt
            _prevPosition.copy(node.position)
            node.position.copy(hit).add(startOffset)

            //get delta
            _delta.subVectors(node.position, _prevPosition)
            // no move exit early
            if (_delta.lengthSq() === 0) return

            // update recusive on node
            this.drafter.updatePatchedNode(node)

            // update Section Lines of Node
            this.drafter.sectionCutter.moveFromNodeSlot(
                _delta,
                _delta,
                slotIndex
            )

            // update transform controsl
            if (this.transformControlsEnabled) {
                this.transformProxy.position.copy(node.position)
                this.transformProxy.updateMatrixWorld(true)
            }
            syncLevaDisplayStub(controls.getNodevalues(node))
        }

        const handlePointerUp = () => {
            syncLevaDisplayStub(controls.getNodevalues(node))
            this.removeActiveEvent("pointermove")
            this.removeActiveEvent("pointerup")
            this.orbitControls.enabled = true
            this.transformControls.enabled = prevEnableTransform
        }

        // prettier-ignore
        this.addActiveEvent("pointermove", "pointermove", handlePointerMove)
        this.addActiveEvent("pointerup", "pointerup", handlePointerUp)
    }

    attachSegmentMoveKey(startHit: THREE.Vector3, mode: string = "both") {
        const line = this.selection.firstTarget("SectionSegment")
        console.log(line)
        if (!line) return
        const index = line.index
        const prevHit = new THREE.Vector3().copy(startHit)

        this.orbitControls.enabled = false
        const prevEnableTransform = this.transformControls.enabled
        this.transformControls.enabled = false

        let p1 = _delta
        let p2 = _delta
        if (mode === "start") {
            p2 = _zero
        } else if (mode === "end") {
            p1 = _zero
        }

        const handlePointerMove = (moveEvent: PointerEvent) => {
            const hit = this.raycastHelper.castFromEventToPlane(moveEvent)
            if (!hit) return

            _delta.subVectors(hit, prevHit)
            if (_delta.lengthSq() === 0) return

            this.drafter.sectionCutter.moveSegmentVector(p1, p2, index)
            prevHit.copy(hit)
        }

        const handlePointerUp = () => {
            this.removeActiveEvent("pointermove")
            this.removeActiveEvent("pointerup")
            this.orbitControls.enabled = true
            this.transformControls.enabled = prevEnableTransform
        }

        // prettier-ignore
        this.addActiveEvent("pointermove", "pointermove", handlePointerMove)
        // prettier-ignore
        this.addActiveEvent("pointerup", "pointerup", handlePointerUp)
    }

    attachInsertGeometry(node: TransformNode) {
        this.selection.clear()
        this.selection.push({
            type: "TransformNode",
            target: node,
        })

        const handlePointerMove = (moveEvent: PointerEvent) => {
            const hit = this.raycastHelper.castFromEventToPlane(moveEvent)
            if (!hit) return
            console.log(hit)
            node.position.copy(hit)
            this.drafter.updatePatchedNode(node)

            // SKIP update Section Lines of Node

            // update transform controsl
            // if (this.transformControlsEnabled) {
            //     this.transformProxy.position.copy(node.position)
            //     this.transformProxy.updateMatrixWorld(true)
            // }
        }

        const handlePointerUp = () => {
            syncLevaDisplayStub(controls.getNodevalues(node))
            setLevaInsertDefault()
            this.selection.clear()
            this.removeActiveEvent("pointermove")
            this.removeActiveEvent("pointerup")
        }

        // prettier-ignore
        this.addActiveEvent( "pointermove", "pointermove", handlePointerMove, window )
        // prettier-ignore
        this.addActiveEvent( "pointerup", "pointerup", handlePointerUp, window )
    }

    handleKeyboardDown = (keyEvent: KeyboardEvent) => {
        // console.log(keyEvent)
        if (keyEvent.key === "Delete") {
            if (keyEvent.repeat) return
            controls.deleteFistObject()
        } else if (keyEvent.key === " ") {
            if (spaceHoldCurr < spaceHoldMax) {
                spaceHoldCurr++
                const node = this.selection.firstTarget("TransformNode")
                if (!node) return
                controls.addLeafNearbyRandomlyNicely(node)
            }
        }
    }

    handleKeyboardUp = (keyEvent: KeyboardEvent) => {
        // console.log(keyEvent)
        if (keyEvent.key === " ") {
            // rest hold counter for space
            spaceHoldCurr = 0
        }
    }

    onDeleteSelection() {
        // as method so can be called from LEVA on delete.
        // call handlePointerUp
        this.activeEvents["pointerup"]?.listener()
        // detach transform from seleccted
        this.detachTransformControls()
        // remove selected
        this.selection.clear()
    }
}
