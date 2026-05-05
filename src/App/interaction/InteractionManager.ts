import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/Addons.js"
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js"
import { Drafter } from "../draft/Drafter"
import type { TransformNode } from "../draft/TransformNode"
import type { NodeLocation } from "../draft/TransformTree"
import { createsCycle } from "../draft/recursive"
import { RaycastHelper } from "./RaycastHelper"
import * as rand from "../utils/random"

type InteractionManagerArgs = {
    camera: THREE.Camera
    scene: THREE.Scene
    domElement: HTMLCanvasElement
    orbitControls: OrbitControls
    drafter: Drafter
    targets?: THREE.Object3D[]
}

type ActiveEvent = {
    target: HTMLCanvasElement | TransformControls
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
        target: HTMLCanvasElement | TransformControls = this.domElement
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
        console.log("handlePointerDown")

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

        const intersects = this.raycastHelper.castFromEvent(e)
        if (intersects.length === 0) {
            if (
                !this.transformControlsEnabled ||
                (!this.transformControls.dragging &&
                    !this.transformControls.axis)
            ) {
                this.detachTransformControls()
            }
            return
        }
        // dont need early returns if we use drafter.interactiveObjects
        const int = intersects[0]
        const id = int.object.userData.id
        const index = int.instanceId
        const location = { id, index } as NodeLocation
        const node = this.drafter.tree.findNode(location) as
            | TransformNode
            | undefined
        if (!node) return

        if (this.transformControlsEnabled) {
            this.attachTransformControls(node)
            // return
        }

        console.log(intersects)
        // console.log(int)
        // console.log(location)
        // console.log(node)

        const startHit = this.raycastHelper.castFromEventToPlane(e)
        const moveOffset = startHit
            ? new THREE.Vector3().subVectors(node.position, startHit)
            : new THREE.Vector3()

        const isRoot = node === node.parent
        if (isRoot) {
            // aval root fns
            // this.randomMoveNode(node)
            this.moveNode(node, moveOffset)
        } else {
            // non root fns
            // this.randomChangeNodeParent(node, location)
            this.moveNode(node, moveOffset)
        }

        // this.randomMoveNode(node)
        // this.randomChangeNodeParent(node, location)
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
        this.transformControls.detach()
        this.orbitControls.enabled = true
    }

    moveNode(node: TransformNode, startOffset: THREE.Vector3) {
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

        this.addActiveEvent(
            "moveNode.pointerMove",
            "pointermove",
            handlePointerMove
        )
        this.addActiveEvent("moveNode.pointerUp", "pointerup", handlePointerUp)
    }

    randomMoveNode(node: TransformNode) {
        const s = 6
        node.position.copy(
            new THREE.Vector3(
                rand.random(-s, s),
                rand.random(-s, s),
                rand.random(-s, s)
            )
        )
        this.drafter.updatePatchedNode(node)
    }

    randomChangeNodeParent(node: TransformNode, location: NodeLocation) {
        const currParent = node.parent.children.indexOf(node)
        if (currParent !== -1) {
            node.parent.children.splice(currParent, 1)
        }

        const bucket = this.drafter.tree.getBucket(location.id)
        if (bucket === undefined) return
        let newIdx = rand.randomInt(0, bucket.count - 1)
        if (newIdx === node.location.index) newIdx = 0
        if (newIdx === node.location.index) newIdx = 1
        const nextParent = bucket[newIdx] as TransformNode | undefined
        if (!nextParent || nextParent === node) return
        if (createsCycle(node, nextParent)) return

        node.parent = nextParent
        node.parent.children.push(node)
        this.drafter.updatePatchedNode(node)
    }
}
