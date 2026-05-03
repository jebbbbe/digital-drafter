import * as THREE from "three"
import { InstancedLineSegments } from "../objects/meshes/InstancedLineSegments"
import { InstancedProjectionMaterial } from "../objects/materials/InstancedProjectionMaterial"
import { InstanceCount } from "./capacity"
import { brushCleaner } from "../objects/geometries/brushCleaner"
import {
    createLinkedInstanceMatrixTexture,
    setInstanceMatrixAt,
    setUintAttributeAt,
    updateBufferRanges,
} from "../objects/buffers/buffers"

export type InstanceItem = {
    // brush:any for CSG later...
    geometry: THREE.BufferGeometry
    localTransform: THREE.Matrix4 // matches head of tree baseTransform..?
    buffers: {
        instanceMatrix: THREE.InstancedBufferAttribute
        dataTexture: THREE.DataTexture
        parentIDs: THREE.InstancedBufferAttribute
    }
    group: THREE.Group
    instances: {
        mesh: THREE.InstancedMesh
        line: InstancedLineSegments<THREE.LineBasicMaterial>
        proj: InstancedLineSegments<InstancedProjectionMaterial>
    }
    count: number
    maxCount: number
}

export function createInstanceItem(
    geometry: THREE.BufferGeometry,
    localTransform: THREE.Matrix4,
    materials: any,
    id: number,
    capacity: number = InstanceCount
): InstanceItem {
    const geometries = brushCleaner(geometry)
    // localTransform.multiply(geometries.localTransform) // how to handle?

    const mesh = new THREE.InstancedMesh(
        geometries.meshGeometry,
        materials.mesh,
        capacity
    )

    const line = new InstancedLineSegments<THREE.LineBasicMaterial>(
        geometries.lineGeometry,
        materials.line,
        capacity
    )

    const proj = new InstancedLineSegments<InstancedProjectionMaterial>(
        geometries.projGeometry,
        materials.projection.clone(),
        capacity
    )
    proj.frustumCulled = false // it doesnt use its matrix buffer, so bounding sphere doesnt update correctly...

    //match shared instanceMatrix
    const instanceMatrix = mesh.instanceMatrix
    line.instanceMatrix = instanceMatrix

    const parentIDs = new THREE.InstancedBufferAttribute(
        new Int8Array(capacity),
        1
    )
    proj.geometry.setAttribute("lookupIndex", parentIDs)
    const dataTexture = createLinkedInstanceMatrixTexture(instanceMatrix)
    proj.material.instanceMatrixTexture = dataTexture

    // userdata for raycast lookups
    // copy all info to isntancces.
    mesh.userData.id = id
    line.userData = mesh.userData
    proj.userData = mesh.userData

    const group = new THREE.Group()
    group.add(mesh, line, proj)

    const newInstanceItem = {
        geometry: geometry,
        localTransform,
        buffers: {
            instanceMatrix,
            dataTexture,
            parentIDs,
        },
        group,
        instances: {
            mesh,
            line,
            proj,
        },
        count: 0,
        maxCount: capacity,
    }
    setInstanceCount(newInstanceItem, 0)

    return newInstanceItem
}

// instance updates
export function incrementInstanceCount(instance: InstanceItem): void {
    instance.count++
    setInstanceCount(instance)
}
export function decrementInstanceCount(instance: InstanceItem): void {
    instance.count--
    setInstanceCount(instance)
}
export function setInstanceCount(instance: InstanceItem, count?: number): void {
    if (count) instance.count = count
    instance.instances.mesh.count = instance.count
    instance.instances.line.count = instance.count
    instance.instances.proj.count = instance.count
}

export function updateSharedBuffers(
    instanceItem: InstanceItem,
    matrix: THREE.Matrix4,
    parentIndex: number
): void {
    const index = instanceItem.count
    setInstanceMatrixAt(instanceItem.buffers.instanceMatrix, index, matrix)
    setUintAttributeAt(instanceItem.buffers.parentIDs, index, parentIndex)
    updateBufferRanges(index, instanceItem.buffers)
    // inc count to draw visible.
    incrementInstanceCount(instanceItem)
}

export function computeBoundingSphere(instanceItem: InstanceItem): void {
    instanceItem.instances.mesh.computeBoundingSphere()
    instanceItem.instances.line.computeBoundingSphere()
    // instanceItem.instances.proj.computeBoundingSphere()
}
