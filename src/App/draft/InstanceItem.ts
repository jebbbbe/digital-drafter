import * as THREE from "three"
import { InstancedLineSegments } from "../objects/meshes/InstancedLineSegments"
import { InstancedProjectionMaterial } from "../objects/materials/InstancedProjectionMaterial"
import { DataTextureLineMaterial } from "../objects/materials/DataTextureLineMaterial"
import { InstanceCount } from "../constants"
import { brushCleaner } from "../objects/geometries/brushCleaner"
import {
    createLinkedInstanceMatrixTexture,
    setInstanceMatrixAt,
    setUintAttributeAt,
    updateBufferRanges,
} from "../objects/buffers/buffers"
import { DataTextureLineSegmentsGeometry } from "../objects/geometries/DataTextureLineSegmentsGeometry"
import { activeMaterialLib } from "./materialManager"
import { constants } from "../constants"

export type InstanceItem = {
    // brush:any for CSG later...
    geometry: THREE.BufferGeometry
    localTransform: THREE.Matrix4 // matches head of tree baseTransform..?
    buffers: {
        instanceMatrix: THREE.InstancedBufferAttribute // keep for raycast
        nodeSlot: THREE.InstancedBufferAttribute
    }
    group: THREE.Group
    instances: {
        mesh: THREE.InstancedMesh
        line:
            | InstancedLineSegments<THREE.LineBasicMaterial>
            | THREE.InstancedMesh
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

    // slot lookup
    const nodeSlot = new THREE.InstancedBufferAttribute(
        new Float32Array(capacity),
        1
    )

    let mesh = new THREE.InstancedMesh(
        geometries.meshGeometry,
        materials.mesh,
        capacity
    )
    mesh.renderOrder = 0
    mesh.frustumCulled = false
    mesh.geometry.setAttribute("nodeSlot", nodeSlot)

    let line

    if (activeMaterialLib === "gl_Line") {
        line = new InstancedLineSegments<THREE.LineBasicMaterial>(
            geometries.lineGeometry,
            materials.line,
            capacity
        )
        line.renderOrder = 2
        line.geometry.setAttribute("nodeSlot", nodeSlot)
        line.frustumCulled = false
    } else {
        const lineMaterial = materials.line.clone() as DataTextureLineMaterial
        const lineGeometry = new DataTextureLineSegmentsGeometry(
            geometries.lineGeometry
        )
        line = new THREE.InstancedMesh(lineGeometry, lineMaterial, capacity)
        line.renderOrder = 2
        line.geometry.setAttribute("nodeSlot", nodeSlot)
        line.frustumCulled = false

        lineMaterial.segments = lineGeometry.dataTexture
        lineMaterial.resolution.set(window.innerWidth, window.innerHeight)
        line.onBeforeRender = () => {
            lineMaterial.resolution.set(window.innerWidth, window.innerHeight)
        }
    }

    const dash = new InstancedLineSegments<THREE.LineDashedMaterial>(
        geometries.lineGeometry,
        materials.dash,
        capacity
    ) as any
    dash.computeLineDistances()
    dash.renderOrder = 1
    dash.geometry.setAttribute("nodeSlot", nodeSlot)
    dash.frustumCulled = false

    const proj = new InstancedLineSegments<InstancedProjectionMaterial>(
        geometries.projGeometry,
        materials.projection,
        capacity
    )
    proj.geometry.setAttribute("nodeSlot", nodeSlot)
    proj.frustumCulled = false

    // need this for raycast
    const instanceMatrix = mesh.instanceMatrix

    // userdata for raycast lookups
    // copy all info to isntancces.
    mesh.userData.id = id
    line.userData = mesh.userData
    dash.userData = mesh.userData
    proj.userData = mesh.userData

    // set visible
    const display = constants.themes.objects[constants.theme].display as any
    mesh.visible = display.mesh.visible
    line.visible = display.line.visible
    dash.visible = display.dash.visible
    proj.visible = display.projection.visible

    const group = new THREE.Group()
    group.add(mesh, line, proj, dash)

    const newInstanceItem = {
        geometry: geometry,
        localTransform,
        buffers: {
            instanceMatrix,
            nodeSlot,
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
    matrix: THREE.Matrix4
): void {
    const index = instanceItem.count
    setInstanceMatrixAt(instanceItem.buffers.instanceMatrix, index, matrix)
    updateBufferRanges(index, instanceItem.buffers)
    // inc count to draw visible.
    incrementInstanceCount(instanceItem)
}

export function computeBoundingSphere(instanceItem: InstanceItem): void {
    instanceItem.instances.mesh.computeBoundingSphere()
    // instanceItem.instances.line.computeBoundingSphere()
    // instanceItem.instances.dash.computeBoundingSphere()
    // instanceItem.instances.proj.computeBoundingSphere()
}
