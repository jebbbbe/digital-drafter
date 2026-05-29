import * as THREE from "three"
import type { TransformNode } from "../draft/TransformNode"
import type { NodeLocation } from "../draft/TransformTree"
import type { OrbitControls } from "three/examples/jsm/Addons.js"
import type { Drafter } from "../draft/Drafter"
import type { SelectObject } from "./selectionManager"
import type { TransformType } from "../draft/TransformNode"
import type { SelectType } from "./selectionManager"
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js"
import { RaycastHelper } from "./RaycastHelper"
import { SelectionManager } from "./selectionManager"
import { ListenerManager } from "./ListenerManager"
import { ThreeControllersManager } from "./controllers"
import * as levaStore from "../../components/Leva/LevaStore"
import { controls } from "../controls/controls"
import { moveFirstObject } from "../controls/interaction"

type InteractionManagerArgs = {
    camera: THREE.Camera
    scene: THREE.Scene
    domElement: HTMLCanvasElement
    orbitControls: OrbitControls
    drafter: Drafter
    targets?: THREE.Object3D[]
}

type MoveListener = {
    move: Function
    up: Function
}

const startHit = new THREE.Vector3()

const _prevPosition = new THREE.Vector3()
const _delta = new THREE.Vector3()

const spaceHoldMax = 20
let spaceHoldCurr = 0

type NodeSelectType = Exclude<SelectType, "SectionSegment">
const nodeKindMap: Record<TransformType, NodeSelectType> = {
    root: "root",
    rotate: "leaf",
    mirror: "leaf",
    slide: "leaf",
    intersect: "leaf",
    sectionParent: "sectionParent",
    sectionChild: "sectionChild",
}

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
    attachTransformControls(object: SelectObject) {
        if (!this.useTransformControls) return

        if (object.kind === "SectionSegment") {
            this.detachTransformControls()
            return
        }

        const node = object.target as TransformNode

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
            levaStore.syncLevaDisplayStub(controls.getNodevalues(node))
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
            this.deselectAll()
            return
        }

        const first = intersects[0]
        // console.log(first)

        this.raycastHelper.castFromEventToPlane(e, startHit)
        if (!startHit) return

        //clear seleciton
        this.selection.clear()

        let selectedObject // select obj ref
        if (first.object === this.drafter.sectionCutter.mesh) {
            // hit section cutter
            const { index, object }: any = intersects[0]
            selectedObject = {
                kind: "SectionSegment",
                target: { object, index },
            } as SelectObject
        } else {
            // find node from raycast
            const id = first.object.userData.id
            const index = first.instanceId
            const location = { id, index } as NodeLocation

            // add node to selection
            const node = this.drafter.findNode(location)
            if (!node) return

            // create SelectObject
            selectedObject = { target: node } as SelectObject
            selectedObject.kind = nodeKindMap[node.type]
        }
        this.selection.push(selectedObject)
        this.attachTransformControls(selectedObject)
        const moveFns = moveFirstObject(undefined, startHit) as MoveListener
        if (moveFns === undefined) return
        // prettier-ignore
        this.listeners.addActiveEvent("pointermove", "pointermove", moveFns.move)
        this.listeners.addActiveEvent("pointerup", "pointerup", moveFns.up)
    }

    handleKeyboardDown = (keyEvent: KeyboardEvent) => {
        // console.log(keyEvent)
        if (keyEvent.key === "Delete") {
            if (keyEvent.repeat) return
            controls.deleteFirstObject()
        } else if (keyEvent.key === " ") {
            if (spaceHoldCurr < spaceHoldMax) {
                spaceHoldCurr++
                const node = this.selection.firstNode()
                if (!node) return
                controls.addLeafNearbyRandomlyNicely(node)
            }
        } else if (keyEvent.key === "Escape") {
            if (keyEvent.repeat) return
            this.deselectAll()
        }
    }

    handleKeyboardUp = (keyEvent: KeyboardEvent) => {
        // console.log(keyEvent)
        if (keyEvent.key === " ") {
            // reset hold counter for space
            spaceHoldCurr = 0
        }
    }

    deselectAll() {
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
