import * as THREE from "three"
import type { Raycastable } from "@types"
import { InteractiveMesh } from "./InteractiveMesh"

export class InteractiveInstancedMesh extends InteractiveMesh {
    readonly instances: THREE.InstancedMesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>
    instanceId: number
    private readonly instanceMatrix = new THREE.Matrix4()
    private readonly instancePosition = new THREE.Vector3()
    private readonly defaultColor = new THREE.Color(0xffffff)

    constructor(
        instances: THREE.InstancedMesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>,
        instanceId: number,
        scene: THREE.Scene,
        raycastObjects: Raycastable
    ) {
        super(instances, scene, raycastObjects)
        this.instances = instances
        this.instanceId = instanceId
        instances.userData.interactiveInstances ??= []
        instances.userData.interactiveInstances[instanceId] = this
        if (instances.instanceColor) instances.getColorAt(instanceId, this.defaultColor)
        instances.setColorAt(instanceId, this.defaultColor)
        instances.instanceColor!.needsUpdate = true
    }

    override getCenter() {
        this.instances.updateWorldMatrix(true, false)
        this.instances.getMatrixAt(this.instanceId, this.instanceMatrix)
        return this.center
            .setFromMatrixPosition(this.instanceMatrix)
            .applyMatrix4(this.instances.matrixWorld)
    }

    override setPosition(position: THREE.Vector3) {
        if (this.instanceId < 0) return
        this.instancePosition.copy(position)
        this.instances.worldToLocal(this.instancePosition)
        this.instances.getMatrixAt(this.instanceId, this.instanceMatrix)
        this.instanceMatrix.setPosition(this.instancePosition)
        this.instances.setMatrixAt(this.instanceId, this.instanceMatrix)
        this.updateBounds()
    }

    override setSelected(selected: boolean) {
        this.selected = selected
        if (this.instanceId < 0) return
        this.instances.setColorAt(
            this.instanceId,
            selected ? this.selectedColor : this.defaultColor
        )
        this.instances.instanceColor!.needsUpdate = true
    }

    private updateBounds() {
        this.instances.instanceMatrix.needsUpdate = true
        this.instances.computeBoundingBox()
        this.instances.computeBoundingSphere()
    }

    override delete() {
        if (this.instanceId < 0) return
        this.setSelected(false)
        const instances = this.instances
        const last = instances.count - 1
        const objects: InteractiveInstancedMesh[] =
            instances.userData.interactiveInstances
        if (this.instanceId !== last) {
            instances.getMatrixAt(last, this.instanceMatrix)
            instances.setMatrixAt(this.instanceId, this.instanceMatrix)
            if (instances.instanceColor) {
                const color = new THREE.Color()
                instances.getColorAt(last, color)
                instances.setColorAt(this.instanceId, color)
                instances.instanceColor.needsUpdate = true
            }
            if (instances.morphTexture) {
                const { data, width } = instances.morphTexture.image
                data?.copyWithin(
                    this.instanceId * width,
                    last * width,
                    (last + 1) * width
                )
                instances.morphTexture.needsUpdate = true
            }
            const moved = objects[last]
            objects[this.instanceId] = moved
            if (moved) {
                moved.instanceId = this.instanceId
            }
        }
        objects.length = --instances.count
        this.instanceId = -1
        this.updateBounds()
        if (instances.count === 0) {
            super.delete()
            delete instances.userData.interactiveInstances
        }
    }
}
