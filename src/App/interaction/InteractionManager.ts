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
        let intersects = this.raycastHelper.castFromEvent(e)
        if (intersects.length === 0) return
        // dont needd early retuirns if we use drafter.interactiveObjects
        const int = intersects[0]
        // if (!int.face) return
        const id = int.object.userData.id
        // if (!id) return
        const index = int.instanceId
        // if (!index) return
        const location = { id, index } as NodeLocation
        const node = this.drafter.tree.findNode(location) as any
        if (!node) return
        console.log("TEST INT")
        console.log(int)
        console.log({ id, index })
        console.log(node)

        // simplle move
        // node.position.copy(new THREE.Vector3(1, 0, 3))
        // this.drafter.updatePatchedNode(node)

        // change node to random other parent
        const currParent = node.parent.children.indexOf(node)
        if (currParent !== -1) {
            node.parent.children.splice(currParent, 1)
        }

        const bucket = this.drafter.tree.buckets[id]
        if (bucket === undefined) return
        let newIdx = rand.randomInt(0, bucket.count - 1)
        if (newIdx === node.location.index) newIdx = 0
        if (newIdx === node.location.index) newIdx = 1
        const nextParent = bucket.array[newIdx] as TransformNode | undefined
        if (!nextParent || nextParent === node) return
        if (createsCycle(node, nextParent)) return

        node.parent = nextParent
        node.parent.children.push(node)
        this.drafter.updatePatchedNode(node)
    }
}
