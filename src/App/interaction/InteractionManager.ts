import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/Addons.js"
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js"
import { Drafter } from "../draft/Drafter"
import type { TransformNode } from "../draft/TransformNode"
import type { NodeLocation } from "../draft/TransformTree"
import { getSlotIndex } from "../objects/textures/GlobalTreeTexture"
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
import { ListenerManager } from "./ListenerManager"
import { ThreeControllersManager } from "./controllers"
import { getNodeLocationFromSlot } from "../objects/textures/GlobalTreeTexture"

type InteractionManagerArgs = {
    camera: THREE.Camera
    scene: THREE.Scene
    domElement: HTMLCanvasElement
    orbitControls: OrbitControls
    drafter: Drafter
    targets?: THREE.Object3D[]
}

const _prevPosition = new THREE.Vector3()
const _delta = new THREE.Vector3()
const _zero = new THREE.Vector3()
const _candidatePosition = new THREE.Vector3()
const _lineDirection = new THREE.Vector3()
const _parentToCandidate = new THREE.Vector3()

const spaceHoldMax = 20
let spaceHoldCurr = 0

export class InteractionManager {
    domElement: HTMLCanvasElement
    scene: THREE.Scene
    drafter: Drafter
    raycastHelper: RaycastHelper
    useTransformControls = true
    selection: SelectionManager
    listeners: ListenerManager
    controllers: ThreeControllersManager
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
        this.drafter = drafter
        this.raycastHelper = new RaycastHelper(camera, targets, domElement)
        this.selection = new SelectionManager(drafter)
        this.listeners = new ListenerManager(this.domElement)

        const transformControls = new TransformControls(camera, domElement)

        this.controllers = new ThreeControllersManager(
            orbitControls,
            transformControls,
            this.useTransformControls
        )

        this.scene.add(this.controllers.transformProxy)
        this.scene.add(transformControls.getHelper())
    }

    addEventListeners(): void {
        // prettier-ignore
        this.listeners.addActiveEvent( "pointerDown", "pointerdown", this.handlePointerDown )
        // prettier-ignore
        this.listeners.addActiveEvent( "transformDraggingChanged", "dragging-changed", this.controllers.handleTransformDraggingChanged, this.controllers.transformControls )
        // prettier-ignore
        this.listeners.addActiveEvent( "general.keydown", "keydown", this.handleKeyboardDown, window )
        // prettier-ignore
        this.listeners.addActiveEvent( "general.keyup", "keyup", this.handleKeyboardUp, window )
    }

    dispose(): void {
        this.listeners.removeAllActiveEvents()
        this.controllers.dispose()
        this.scene.remove(this.controllers.transformProxy)
        this.scene.remove(this.controllers.transformControls.getHelper())
    }

    // Transform Controls
    attachTransformControls(node: TransformNode) {
        if (!this.useTransformControls) return

        const slotIndex = getSlotIndex(node.location)

        this.controllers.setGizmoPosition(node.position)

        const handleObjectChange = () => {
            _prevPosition.copy(node.position)
            node.position.copy(this.controllers.getGizmoPosition())
            _delta.subVectors(node.position, _prevPosition)
            if (_delta.lengthSq() === 0) return

            //  move all children segments
            // if we always lock move difs for section transform nodes, im not sure we will need this?, would have to pass dif fthru defs tho
            const children = node.children
            for (let i = 0; i < children.length; i++) {
                const child = children[i]
                const attachment = this.drafter.attachments.getByKind(
                    child,
                    "segment"
                )[0]
                if (attachment === undefined) continue
                const index = attachment.index
                this.drafter.sectionCutter.moveSegmentVector(
                    _delta,
                    _delta,
                    index
                )
            }

            this.drafter.updatePatchedNode(node)
            syncLevaDisplayStub(controls.getNodevalues(node))
        }

        this.listeners.addActiveEvent(
            "transformObjectChange",
            "objectChange",
            handleObjectChange,
            this.controllers.transformControls
        )

        this.controllers.attachTransformProxy()
    }
    detachTransformControls() {
        this.listeners.removeActiveEvent("transformObjectChange")
        this.controllers.detachTransformControls()
    }

    gizmoCLicked(e: PointerEvent): boolean {
        if (
            this.useTransformControls &&
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

    handlePointerDown = (e: PointerEvent): void => {
        // exit early for multiple touchs on mobile
        if (e.pointerType === "touch" && !e.isPrimary) return

        // if we clicked the gizmo, exit early so we can use it
        if (this.gizmoCLicked(e)) return

        //raycast to interactive objects in the scene
        const intersects = this.raycastHelper.castFromEvent(e)

        // nothing hit!
        if (intersects.length === 0) {
            // detach transform controls
            if (this.useTransformControls) {
                this.detachTransformControls()
            }
            // remove previous seleciton
            this.selection.clear()

            // clear leva panel
            syncLevaDisplayStub({
                positionValue: { x: 0, z: 0 },
                rotateValue: { x: 0, y: 0 },
                scaleValue: 1.0,
            })
            disableStub()
            return
        }

        const first = intersects[0]
        // console.log(first)

        const startHit = this.raycastHelper.castFromEventToPlane(e)
        if (!startHit) return

        //clear seleciton
        this.selection.clear()

        if (first.object === this.drafter.sectionCutter.mesh) {
            // hit section cutter
            const { point, index, object }: any = intersects[0]
            point.y = 0 // force

            // add selection
            this.selection.push({
                type: "SectionSegment",
                target: { object, index },
            } as SelectObject)

            // const start = new THREE.Vector3()
            // const end = new THREE.Vector3()
            // this.drafter.sectionCutter.getSegmentAsVector(index, start, end)

            // const totalDist = start.distanceToSquared(end)
            // const threshold = totalDist / 16
            // let mode: "start" | "end" | "both" = "both"
            // if (point.distanceToSquared(start) <= threshold) {
            // mode = "start"
            // } else if (point.distanceToSquared(end) <= threshold) {
            // mode = "end"
            // }

            this.detachTransformControls()
            this.attachSegmentMoveKey(startHit)
        } else {
            // hit Node
            // find node from raycast
            const id = first.object.userData.id
            const index = first.instanceId
            const location = { id, index } as NodeLocation
            // prettier-ignore
            const node = this.drafter.tree.findNode(location) as  TransformNode | undefined
            if (!node) return

            // add selection
            this.selection.push({
                type: "TransformNode",
                target: node,
            })

            const isRoot = node === node.parent

            // set leva panel values
            syncLevaDisplayStub(controls.getNodevalues(node))

            // enable ui buttons
            if (isRoot) {
                enableRootStub()
            } else {
                enableLeafStub()
            }

            // moveOffset
            const moveOffset = startHit
                ? new THREE.Vector3().subVectors(node.position, startHit)
                : new THREE.Vector3()

            // attach events
            this.attachNodeMove(moveOffset)
            this.attachTransformControls(node)
        }
    }

    //events
    attachNodeMove(startOffset: THREE.Vector3) {
        const node = this.selection.firstTarget("TransformNode")
        if (!node) return
        const slotIndex = getSlotIndex(node.location)
        const hasParentConstraint = node.parent !== node
        const parentPosition = hasParentConstraint
            ? node.parent.position.clone()
            : undefined
        const lineLengthSq = hasParentConstraint
            ? _lineDirection
                  .subVectors(node.position, node.parent.position)
                  .lengthSq()
            : 0
        this.controllers.pauseControls()

        const handlePointerMove = (moveEvent: PointerEvent) => {
            // get xz pos
            const hit = this.raycastHelper.castFromEventToPlane(moveEvent)
            if (!hit) return

            // add offset to pt
            _prevPosition.copy(node.position)
            _candidatePosition.copy(hit).add(startOffset)

            const constrainMove =
                moveEvent.shiftKey && parentPosition && lineLengthSq > 0

            if (constrainMove) {
                const t = _parentToCandidate
                    .subVectors(_candidatePosition, parentPosition)
                    .dot(_lineDirection)

                node.position
                    .copy(parentPosition)
                    .addScaledVector(_lineDirection, t / lineLengthSq)
            } else {
                node.position.copy(_candidatePosition)
            }

            //get delta
            _delta.subVectors(node.position, _prevPosition)

            // no move exit early
            if (_delta.lengthSq() === 0) return

            // update recusive on node
            this.drafter.updatePatchedNode(node)

            //  move all children nodes
            const children = node.children
            for (let i = 0; i < children.length; i++) {
                const child = children[i]
                const attachment = this.drafter.attachments.getByKind(
                    child,
                    "segment"
                )[0]
                if (attachment === undefined) continue
                const index = attachment.index
                this.drafter.sectionCutter.moveSegmentVector(
                    _delta,
                    _delta,
                    index
                )
            }

            // updateGizmoPosition
            this.controllers.setGizmoPosition(node.position)
            // update leva values
            syncLevaDisplayStub(controls.getNodevalues(node))
        }

        const handlePointerUp = () => {
            syncLevaDisplayStub(controls.getNodevalues(node))
            this.listeners.removeActiveEvent("pointermove")
            this.listeners.removeActiveEvent("pointerup")
            this.controllers.resumeControls()
        }

        // prettier-ignore
        this.listeners.addActiveEvent("pointermove", "pointermove", handlePointerMove)
        this.listeners.addActiveEvent("pointerup", "pointerup", handlePointerUp)
    }

    attachSegmentMoveKey(startHit: THREE.Vector3, mode: string = "both") {
        const line = this.selection.firstTarget("SectionSegment")
        console.log(line)
        if (!line) return
        const index = line.index
        const prevHit = new THREE.Vector3().copy(startHit)
        const sectionCutter = this.drafter.sectionCutter

        this.controllers.pauseControls()

        let p1 = _delta
        let p2 = _delta
        if (mode === "start") {
            p2 = _zero
        } else if (mode === "end") {
            p1 = _zero
        }

        // origin
        const node = this.drafter.sectionCutter.nodeMap.get(index)
        if (node === undefined) return
        const parent = node.parent
        if (parent === undefined) return

        const handlePointerMove = (moveEvent: PointerEvent) => {
            const shiftHeld = moveEvent.shiftKey
            if (shiftHeld) {
                console.warn("not implemented")
            } else {
                const hit = this.raycastHelper.castFromEventToPlane(moveEvent)
                if (!hit) return

                _delta.subVectors(hit, prevHit)
                if (_delta.lengthSq() === 0) return

                sectionCutter.moveSegmentVector(p1, p2, index)
                prevHit.copy(hit)
            }
        }

        const handlePointerUp = () => {
            this.listeners.removeActiveEvent("pointermove")
            this.listeners.removeActiveEvent("pointerup")
            this.controllers.resumeControls()
        }

        // prettier-ignore
        this.listeners.addActiveEvent("pointermove", "pointermove", handlePointerMove)
        // prettier-ignore
        this.listeners.addActiveEvent("pointerup", "pointerup", handlePointerUp)
    }

    attachInsertGeometry(node: TransformNode) {
        const insertPointerMoveEvent = "insert.pointermove"
        const insertPointerUpEvent = "insert.pointerup"

        this.selection.clear()
        this.selection.push({
            type: "TransformNode",
            target: node,
        })

        let hasStartedInsert = false

        const handlePointerUp = () => {
            syncLevaDisplayStub(controls.getNodevalues(node))
            setLevaInsertDefault()
            this.selection.clear()
            this.listeners.removeActiveEvent(insertPointerMoveEvent)
            this.listeners.removeActiveEvent(insertPointerUpEvent)
        }

        const handlePointerMove = (moveEvent: PointerEvent) => {
            const hit = this.raycastHelper.castFromEventToPlane(moveEvent)
            if (!hit) return

            if (!hasStartedInsert) {
                hasStartedInsert = true
                this.listeners.addActiveEvent(
                    insertPointerUpEvent,
                    "pointerup",
                    handlePointerUp,
                    window
                )
            }

            node.position.copy(hit)
            this.drafter.updatePatchedNode(node)
        }

        // prettier-ignore
        this.listeners.addActiveEvent( insertPointerMoveEvent, "pointermove", handlePointerMove, window )
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
        } else if (keyEvent.key === "Escape") {
            if (keyEvent.repeat) return
            this.deselectALL()
        }
    }

    handleKeyboardUp = (keyEvent: KeyboardEvent) => {
        // console.log(keyEvent)
        if (keyEvent.key === " ") {
            // reset hold counter for space
            spaceHoldCurr = 0
        }
    }

    deselectALL() {
        // hide transform controls
        this.detachTransformControls()
        //clear selecction geo
        this.selection.clear()
        // detach leva
        syncLevaDisplayStub({
            positionValue: { x: 0, z: 0 },
            rotateValue: { x: 0, y: 0 },
            scaleValue: 1.0,
        })
        disableStub()
        // detach mouse events
        this.listeners.activeEvents["pointerup"]?.listener()
        // this.listeners.removeActiveEvent("pointerup")
        // this.listeners.removeActiveEvent("pointermove")
    }
}
