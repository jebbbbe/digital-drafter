import * as THREE from "three"
import { InstancedLineSegments } from "../objects/meshes/InstancedLineSegments"
import { InstancedProjectionMaterial } from "../objects/materials/InstancedProjectionMaterial"
import { DataTextureLineMaterial } from "../objects/materials/DataTextureLineMaterial"
import { InstanceCount } from "./capacity"
import { brushCleaner } from "../objects/geometries/brushCleaner"
import {
    createLinkedInstanceMatrixTexture,
    setInstanceMatrixAt,
    setUintAttributeAt,
    updateBufferRanges,
} from "../objects/buffers/buffers"
import { DataTextureLineSegmentsGeometry } from "../objects/geometries/DataTextureLineSegmentsGeometry"
import { activeMaterialLib } from "./materialManager"

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
        line: InstancedLineSegments<THREE.LineBasicMaterial> | THREE.InstancedMesh 
        proj: InstancedLineSegments<InstancedProjectionMaterial>
        dash: InstancedLineSegments<THREE.LineDashedMaterial>
    }
    count: number
    maxCount: number
}

export function createInstanceItem(
    geometry: THREE.BufferGeometry,
    materials: any,
    id: number,
    capacity: number = InstanceCount
): InstanceItem {
    const geometries = brushCleaner(geometry)
    const localTransform = geometries.localTransform

    const mesh = new THREE.InstancedMesh(
        geometries.meshGeometry,
        materials.mesh,
        capacity
    )
    mesh.renderOrder = 0

    let line
    if (activeMaterialLib === "gl_Line") {
        line = new InstancedLineSegments<THREE.LineBasicMaterial>(
            geometries.lineGeometry,
            materials.line,
            capacity
        )
        line.renderOrder = 2
    } else {
        const lineMaterial = materials.line.clone() as DataTextureLineMaterial
        const lineGeometry = new DataTextureLineSegmentsGeometry(
            geometries.lineGeometry
        )
        line = new THREE.InstancedMesh(lineGeometry, lineMaterial, capacity)
        line.renderOrder = 2
        lineMaterial.segments = lineGeometry.dataTexture
        lineMaterial.resolution.set(window.innerWidth, window.innerHeight)
        line.onBeforeRender = () => {
            lineMaterial.resolution.set(window.innerWidth, window.innerHeight)
        }
    }

    const dash = new InstancedLineSegments<THREE.LineDashedMaterial>(
        geometries.lineGeometry,
        materials.dash.clone(), // set scale here manualy...
        capacity
    )
    dash.computeLineDistances()
    // if we use a root with differenct transform, this will be stale...
    // wuold need new material inside of the InstancceItem...
    // hopefully line 2 can fix with screen sapce dashed materials
    const scale = new THREE.Vector3()
    localTransform.decompose(new THREE.Vector3(), new THREE.Quaternion(), scale)
    dash.material.scale = scale.x
    dash.renderOrder = 1

    const proj = new InstancedLineSegments<InstancedProjectionMaterial>(
        geometries.projGeometry,
        materials.projection.clone(),
        capacity
    )
    proj.frustumCulled = false // it doesnt use its matrix buffer, so bounding sphere doesnt update correctly...

    //match shared instanceMatrix
    const instanceMatrix = mesh.instanceMatrix
    line.instanceMatrix = instanceMatrix
    dash.instanceMatrix = instanceMatrix

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
    dash.userData = mesh.userData
    proj.userData = mesh.userData

    const group = new THREE.Group()
    group.add(mesh, line, proj, dash)

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
            dash,
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
    if (count !== undefined) instance.count = count
    instance.instances.mesh.count = instance.count
    instance.instances.line.count = instance.count
    instance.instances.dash.count = instance.count
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
    instanceItem.instances.dash.computeBoundingSphere()
    // instanceItem.instances.proj.computeBoundingSphere()
}
