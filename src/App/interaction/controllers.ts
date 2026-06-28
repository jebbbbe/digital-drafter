import * as THREE from "three"
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import type { TransformControls } from "three/examples/jsm/controls/TransformControls.js"

let _prevEnableTransform: boolean = false
const _nodePosition = new THREE.Vector3()

export class ThreeControllersManager {
    orbitControls: OrbitControls
    transformControls: TransformControls
    transformProxy = new THREE.Object3D()
    cachedAnchorOffset = new THREE.Vector3()
    useTransformControls: boolean
    constructor(
        orbitControls: OrbitControls,
        transformControls: TransformControls,
        useTransformControls: boolean = true // enable/ disable gizmo
    ) {
        this.orbitControls = orbitControls
        this.transformControls = transformControls
        this.useTransformControls = useTransformControls
        this.setGizmoTranslate()
    }

    //gizmo
    setGizmoTranslate() {
        this.transformControls.setMode("translate")
        this.transformControls.setSpace("world")
        this.transformControls.showX = true
        this.transformControls.showY = false
        this.transformControls.showZ = true
        this.transformControls.translationSnap = 0.25
    }

    setGizmoTranslate1d() {
        this.transformControls.setMode("translate")
        this.transformControls.setSpace("local")
        this.transformControls.showX = true
        this.transformControls.showY = false
        this.transformControls.showZ = false
        this.transformControls.translationSnap = 0
    }

    setGizmoRotate() {
        this.transformControls.setMode("rotate")
        this.transformControls.showX = false
        this.transformControls.showY = true
        this.transformControls.showZ = false
    }

    handleTransformDraggingChanged = (e: { value: unknown }) => {
        this.orbitControls.enabled = !Boolean(e.value)
    }

    attachTransformProxy() {
        this.transformControls.attach(this.transformProxy)
    }

    detachTransformControls() {
        this.transformControls.detach()
        this.orbitControls.enabled = true
    }

    setGizmoPosition(position: THREE.Vector3) {
        this.transformProxy.position.copy(position).add(this.cachedAnchorOffset)
        this.transformProxy.rotation.set(0, 0, 0)
        this.transformProxy.scale.set(1, 1, 1)
        this.transformProxy.updateMatrixWorld(true)
    }

    updateGizmoPosition(position: THREE.Vector3) {
        this.transformProxy.position.copy(position).add(this.cachedAnchorOffset)
        this.transformProxy.updateMatrixWorld(true)
    }

    setAnchorCache(nodePosition: THREE.Vector3, anchoredCenter: THREE.Vector3) {
        this.cachedAnchorOffset.subVectors(anchoredCenter, nodePosition)
    }

    getGizmoPosition(target = _nodePosition) {
        return target
            .copy(this.transformProxy.position)
            .sub(this.cachedAnchorOffset)
    }

    setGizmoQuaternion(quaternion: THREE.Quaternion) {
        this.transformProxy.quaternion.copy(quaternion)
        this.transformProxy.updateMatrixWorld(true)
    }

    /*
    call to pause mouse events for these objects
    */
    pauseControls() {
        this.orbitControls.enabled = false
        _prevEnableTransform = this.transformControls.enabled
        this.transformControls.enabled = false
    }
    /*
    call to resume mouse events for these objects 
    */
    resumeControls() {
        this.orbitControls.enabled = true
        this.transformControls.enabled = _prevEnableTransform
    }

    dispose() {
        this.transformControls.detach()
    }
}
