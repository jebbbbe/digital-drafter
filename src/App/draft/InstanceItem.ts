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
import type { Brush } from "three-bvh-csg"

export type InstanceItem = {
    brush: Brush
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
        outline:
            | InstancedLineSegments<THREE.LineBasicMaterial>
            | THREE.InstancedMesh
        proj: InstancedLineSegments<InstancedProjectionMaterial>
        dash: InstancedLineSegments<THREE.LineDashedMaterial>
        fold: InstancedLineSegments
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
    geometries.brush.matrixAutoUpdate = false

    const localTransform = geometries.localTransform

    let mesh = new THREE.InstancedMesh(
        geometries.meshGeometry,
        materials.mesh,
        capacity
    )

    let line, outline

    if (activeMaterialLib === "gl_Line") {
        line = new InstancedLineSegments<THREE.LineBasicMaterial>(
            geometries.lineGeometry,
            materials.line,
            capacity
        )
        outline = new InstancedLineSegments<THREE.LineBasicMaterial>(
            geometries.lineGeometry,
            materials.outline,
            capacity
        )
    } else {
        const lineMaterial = materials.line.clone() as DataTextureLineMaterial
        const lineGeometry = new DataTextureLineSegmentsGeometry(
            geometries.lineGeometry
        )
        lineMaterial.segments = lineGeometry.dataTexture
        lineMaterial.resolution.set(window.innerWidth, window.innerHeight)
        line = new THREE.InstancedMesh(lineGeometry, lineMaterial, capacity)
        line.onBeforeRender = () => {
            lineMaterial.resolution.set(window.innerWidth, window.innerHeight)
        }

        const outLineMaterial =
            materials.outline.clone() as DataTextureLineMaterial
        const outLineGeometry = new DataTextureLineSegmentsGeometry(
            geometries.lineGeometry
        )
        outLineMaterial.segments = outLineGeometry.dataTexture
        outLineMaterial.resolution.set(window.innerWidth, window.innerHeight)
        outline = new THREE.InstancedMesh(
            outLineGeometry,
            outLineMaterial,
            capacity
        )
        outline.onBeforeRender = () => {
            outLineMaterial.resolution.set(
                window.innerWidth,
                window.innerHeight
            )
        }
    }

    const dash = new InstancedLineSegments<THREE.LineDashedMaterial>(
        geometries.lineGeometry,
        materials.dash,
        capacity
    ) as any
    dash.computeLineDistances()

    const proj = new InstancedLineSegments<InstancedProjectionMaterial>(
        geometries.projGeometry,
        materials.projection,
        capacity
    )

    const fold = new InstancedLineSegments<InstancedProjectionMaterial>(
        geometries.foldGeometry,
        materials.fold,
        capacity
    )

    //render order
    mesh.renderOrder = 0
    line.renderOrder = 3
    outline.renderOrder = -1
    dash.renderOrder = 1
    proj.renderOrder = 1
    fold.renderOrder = 1

    // slot lookup
    const nodeSlot = new THREE.InstancedBufferAttribute(
        new Float32Array(capacity),
        1
    )
    mesh.geometry.setAttribute("nodeSlot", nodeSlot)
    line.geometry.setAttribute("nodeSlot", nodeSlot)
    outline.geometry.setAttribute("nodeSlot", nodeSlot)
    dash.geometry.setAttribute("nodeSlot", nodeSlot)
    proj.geometry.setAttribute("nodeSlot", nodeSlot)
    fold.geometry.setAttribute("nodeSlot", nodeSlot)

    // set frustumCulled
    mesh.frustumCulled = false
    line.frustumCulled = false
    outline.frustumCulled = false
    dash.frustumCulled = false
    proj.frustumCulled = false
    fold.frustumCulled = false

    // need this for raycast
    const instanceMatrix = mesh.instanceMatrix

    // userdata for raycast lookups
    // copy all info to isntancces.
    mesh.userData.id = id
    line.userData = mesh.userData
    outline.userData = mesh.userData
    dash.userData = mesh.userData
    proj.userData = mesh.userData
    fold.userData = mesh.userData

    // set visible
    const display = constants.themes.objects[constants.theme].display as any
    mesh.visible = display.mesh.visible
    line.visible = display.line.visible
    outline.visible = display.line.visible
    dash.visible = display.dash.visible
    proj.visible = display.projection.visible
    fold.visible = display.fold.visible

    const group = new THREE.Group()
    group.add(mesh, line, outline, proj, dash, fold)

    const newInstanceItem = {
        brush: geometries.brush, // original geometries brush
        geometry: geometry, // possibly changed buffers, uv, normal, etc
        localTransform,
        buffers: {
            instanceMatrix,
            nodeSlot,
        },
        group,
        instances: {
            mesh,
            line,
            outline,
            dash,
            proj,
            fold,
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
    instance.instances.outline.count = instance.count
    instance.instances.dash.count = instance.count
    instance.instances.proj.count = instance.count
    instance.instances.fold.count = instance.count
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
