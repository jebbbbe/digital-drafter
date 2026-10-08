import * as THREE from "three"
import { InteractiveObject } from "./InteractiveObject"
import type { GizmoSettings, PanelSettings, Raycastable } from "@types"
import { controllers } from "../AppContext"
import { updatePanel } from "../../components/Leva/LevaStore"

const _zero = new THREE.Vector3()
const _quaternion = new THREE.Quaternion()

type BasicMesh = THREE.Mesh<
    THREE.BufferGeometry,
    THREE.MeshBasicMaterial | THREE.MeshBasicMaterial[]
>

export class InteractiveMesh extends InteractiveObject {
    readonly mesh: BasicMesh
    private readonly raycastObjects: Raycastable
    protected readonly center = new THREE.Vector3()
    private readonly localPosition = new THREE.Vector3()
    protected readonly selectedColor = new THREE.Color(0xe6e600)
    private readonly originalMaterial: BasicMesh["material"]

    constructor(mesh: BasicMesh, scene: THREE.Scene, raycastObjects: Raycastable) {
        super()
        this.mesh = mesh
        this.raycastObjects = raycastObjects
        this.originalMaterial = mesh.material
        if (!(mesh instanceof THREE.InstancedMesh)) {
            mesh.material = Array.isArray(mesh.material)
                ? mesh.material.map(material => material.clone())
                : mesh.material.clone()
            mesh.userData.interactiveObject = this
        }
        if (mesh.parent !== scene) scene.add(mesh)
        if (!raycastObjects.includes(mesh)) raycastObjects.push(mesh)
    }

    override getCenter() {
        return this.mesh.getWorldPosition(this.center)
    }

    override move(delta: THREE.Vector3) {
        this.setPosition(this.getCenter().add(delta))
    }

    override setPosition(position: THREE.Vector3) {
        this.localPosition.copy(position)
        this.mesh.parent?.worldToLocal(this.localPosition)
        this.mesh.position.copy(this.localPosition)
        this.mesh.updateMatrix()
        this.mesh.updateWorldMatrix(false, true)
    }

    override setSelected(selected: boolean) {
        this.selected = selected
        const materials = Array.isArray(this.mesh.material)
            ? this.mesh.material : [this.mesh.material]
        const originals = Array.isArray(this.originalMaterial)
            ? this.originalMaterial : [this.originalMaterial]
        materials.forEach((material, index) => {
            material.color.copy(selected ? this.selectedColor : originals[index].color)
        })
    }

    override gizmoSetup(settings: Partial<GizmoSettings>) {
        controllers.setGizmoSettings({
            anchor: _zero,
            center: this.getCenter(),
            quaternion: _quaternion,
            preset: "translate",
            ...settings,
        })
    }

    override panelSetup(settings: Partial<PanelSettings>) {
        updatePanel({
            position: this.getCenter(),
            rotation: { x: 0, y: 0 },
            scale: 1,
            usePosition: true,
            useRotation: false,
            useScale: false,
            useButtons: false,
            ...settings,
        })
    }

    override gizmoListener(position = controllers.getGizmoPosition()) {
        this.setPosition(position)
    }

    override delete() {
        this.setSelected(false)
        this.mesh.removeFromParent()
        const index = this.raycastObjects.indexOf(this.mesh)
        if (index !== -1) this.raycastObjects.splice(index, 1)
        delete this.mesh.userData.interactiveObject
        if (!(this.mesh instanceof THREE.InstancedMesh)) {
            const materials = Array.isArray(this.mesh.material)
                ? this.mesh.material : [this.mesh.material]
            materials.forEach(material => material.dispose())
            this.mesh.material = this.originalMaterial
        }
    }
}
