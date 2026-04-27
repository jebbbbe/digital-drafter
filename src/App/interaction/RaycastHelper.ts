import * as THREE from "three"

export class RaycastHelper {
    camera: THREE.Camera
    scene: THREE.Scene
    domElem: HTMLCanvasElement
    raycaster = new THREE.Raycaster()
    pointer = new THREE.Vector2()
    constructor(
        camera: THREE.Camera,
        scene: THREE.Scene,
        domElem: HTMLCanvasElement
    ) {
        this.camera = camera
        this.scene = scene
        this.domElem = domElem
    }
    castFromEvent(
        e: MouseEvent,
        objects: THREE.Object3D[] = this.scene.children,
        recursive: boolean = false
    ) {
        // convert to NDC
        const rect = this.domElem.getBoundingClientRect?.() ?? {
            left: 0,
            top: 0,
            width: innerWidth,
            height: innerHeight,
        }
        this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
        this.raycaster.setFromCamera(this.pointer, this.camera)
        return this.raycaster.intersectObjects(objects, recursive)
    }
}
