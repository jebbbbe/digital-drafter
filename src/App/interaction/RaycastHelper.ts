import * as THREE from "three"

const _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const _planeHit = new THREE.Vector3()

export class RaycastHelper {
    raycaster = new THREE.Raycaster()
    pointer = new THREE.Vector2()
    camera: THREE.Camera
    targets: THREE.Object3D[]
    domElem: HTMLCanvasElement
    constructor(
        camera: THREE.Camera,
        targets: THREE.Scene | THREE.Object3D[] = [],
        domElem: HTMLCanvasElement
    ) {
        this.camera = camera
        this.domElem = domElem
        if (targets instanceof THREE.Scene) {
            this.targets = targets.children
        } else {
            this.targets = targets
        }
        this.raycaster.params.Line.threshold = 0.05
    }
    castFromEvent(
        e: MouseEvent,
        objects: THREE.Object3D[] = this.targets,
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

    castFromEventToPlane(
        e: MouseEvent,
        plane: THREE.Plane = _groundPlane,
        target: THREE.Vector3 = _planeHit
    ) {
        const rect = this.domElem.getBoundingClientRect?.() ?? {
            left: 0,
            top: 0,
            width: innerWidth,
            height: innerHeight,
        }
        this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
        this.raycaster.setFromCamera(this.pointer, this.camera)
        return this.raycaster.ray.intersectPlane(plane, target)
    }
}
