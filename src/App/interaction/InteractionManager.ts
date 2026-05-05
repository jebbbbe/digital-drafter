import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/Addons.js"
import { Drafter } from "../draft/Drafter"
import type { TransformNode } from "../draft/TransformNode"
import type { NodeLocation } from "../draft/TransformTree"
import { createsCycle } from "../draft/recursive"
import { RaycastHelper } from "./RaycastHelper"
import * as rand from "../utils/random"

type InteractionManagerArgs = {
    camera: THREE.Camera
    domElement: HTMLCanvasElement
    orbitControls: OrbitControls
    drafter: Drafter
    targets?: THREE.Object3D[]
}

export class InteractionManager {
    domElement: HTMLCanvasElement
    orbitControls: OrbitControls
    drafter: Drafter
    raycastHelper: RaycastHelper

    constructor({
        camera,
        domElement,
        orbitControls,
        drafter,
        targets = drafter.interactivObjects,
    }: InteractionManagerArgs) {
        this.domElement = domElement
        this.orbitControls = orbitControls
        this.drafter = drafter
        this.raycastHelper = new RaycastHelper(camera, targets, domElement)
    }

    addEventListeners(): void {
        this.domElement.addEventListener("pointerdown", this.handlePointerDown)
    }

    dispose(): void {
        this.domElement.removeEventListener(
            "pointerdown",
            this.handlePointerDown
        )
    }

    handlePointerDown = (e: PointerEvent): void => {
        console.log("handlePointerDown")
        const intersects = this.raycastHelper.castFromEvent(e)
        if (intersects.length === 0) return
        // dont need early returns if we use drafter.interactiveObjects
        const int = intersects[0]
        const id = int.object.userData.id
        const index = int.instanceId
        const location = { id, index } as NodeLocation
        const node = this.drafter.tree.findNode(location) as
            | TransformNode
            | undefined
        if (!node) return

        // console.log(int)
        // console.log(location)
        // console.log(node)

        const isRoot = node === node.parent
        if (isRoot) {
            // aval root fns
            this.randomMoveNode(node)
        } else {
            // non root fns
            this.randomChangeNodeParent(node, location)
        }

        // this.randomMoveNode(node)
        // this.randomChangeNodeParent(node, location)
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
