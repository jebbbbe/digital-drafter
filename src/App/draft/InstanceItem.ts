import * as THREE from "three"
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js"
import { InstancedLineSegments } from "../objects/meshes/InstancedLineSegments"
import { InstancedLineSegments2 } from "../objects/meshes/InstancedLineSegments2"
import { InstancedProjectionMaterial } from "../objects/materials/InstancedProjectionMaterial"
import { DataTextureLineMaterial } from "../objects/materials/DataTextureLineMaterial"
import { InstancedLineMaterial } from "../objects/materials/InstancedLineMaterial"
import { InstanceCount } from "../constants"
import { brushCleaner } from "../objects/geometries/brushCleaner"
import {
    setInstanceMatrixAt,
    setUintAttributeAt,
    updateBufferRanges,
} from "../objects/buffers/buffers"
import { DataTextureLineSegmentsGeometry } from "../objects/geometries/DataTextureLineSegmentsGeometry"
import { activeMaterialLib, orders } from "./materialManager"
import { constants } from "../constants"
import type { Brush } from "three-bvh-csg"
import type { TransformNode } from "./TransformNode"

export class InstanceItem {
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
            | InstancedLineSegments2
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
    constructor(
        geometry: THREE.BufferGeometry,
        materials: any,
        id: number,
        capacity: number = InstanceCount
    ) {
        const geometries = brushCleaner(geometry)
        const localTransform = geometries.localTransform

        const mesh = new THREE.InstancedMesh(
            geometries.meshGeometry,
            materials.mesh,
            capacity
        )

        let line:
            | InstancedLineSegments<THREE.LineBasicMaterial>
            | InstancedLineSegments2
            | THREE.InstancedMesh

        let outline:
            | InstancedLineSegments<THREE.LineBasicMaterial>
            | THREE.InstancedMesh

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
            const lineGeometry = new LineSegmentsGeometry().fromEdgesGeometry(
                geometries.lineGeometry
            )
            line = new InstancedLineSegments2(
                lineGeometry,
                materials.line as InstancedLineMaterial,
                capacity
            )
            line.onBeforeRender = (renderer: THREE.WebGLRenderer) => {
                const material = line.material as InstancedLineMaterial
                material.treeData = materials.line.treeData
                material.treeDataSize = materials.line.treeDataSize
                material.treeBlockOffset = id
                material.treeBlockSize = InstanceCount
                material.instanceMatrixCount = Math.max(1, line.count)
                material.resolution.set(window.innerWidth, window.innerHeight)
                material.uniformsNeedUpdate = true
                InstancedLineSegments2.prototype.onBeforeRender.call(
                    line,
                    renderer
                )
            }

            const outLineGeometry = new DataTextureLineSegmentsGeometry(
                geometries.lineGeometry
            )
            outline = new THREE.InstancedMesh(
                outLineGeometry,
                materials.outline as DataTextureLineMaterial,
                capacity
            )
            outline.onBeforeRender = () => {
                const material = outline.material as DataTextureLineMaterial
                material.segments = (
                    outline.geometry as DataTextureLineSegmentsGeometry
                ).dataTexture
                material.treeBlockOffset = id
                material.treeBlockSize = InstanceCount
                material.instanceMatrixCount = Math.max(1, outline.count)
                material.resolution.set(window.innerWidth, window.innerHeight)
                material.uniformsNeedUpdate = true
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
        mesh.renderOrder = orders.mesh
        line.renderOrder = orders.line
        outline.renderOrder = orders.outline
        dash.renderOrder = orders.dash
        proj.renderOrder = orders.proj
        fold.renderOrder = orders.fold

        // need this for raycast
        const instanceMatrix = mesh.instanceMatrix

        // slot lookup
        const nodeSlot = new THREE.InstancedBufferAttribute(
            new Float32Array(capacity),
            1
        )
        mesh.geometry.setAttribute("nodeSlot", nodeSlot)
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

        this.brush = geometries.brush // original geometries brush
        this.geometry = geometry // possibly changed buffers, uv, normal, etc
        this.localTransform = localTransform
        this.buffers = {
            instanceMatrix,
            nodeSlot,
        }
        this.group = group
        this.instances = {
            mesh,
            line,
            outline,
            dash,
            proj,
            fold,
        }
        this.count = 0
        this.maxCount = capacity
        this.setInstanceCount(0)
    }

    private setInstanceCount(count: number = this.count): void {
        this.count = count
        this.instances.mesh.count = this.count
        this.instances.line.count = this.count
        this.instances.outline.count = this.count
        this.instances.dash.count = this.count
        this.instances.proj.count = this.count
        this.instances.fold.count = this.count
    }

    incrementInstanceCount(): void {
        this.count++
        this.setInstanceCount()
    }

    decrementInstanceCount(): void {
        this.count--
        this.setInstanceCount()
    }

    updateSharedBuffers(matrix: THREE.Matrix4): void {
        const index = this.count
        setInstanceMatrixAt(this.buffers.instanceMatrix, index, matrix)
        updateBufferRanges(index, this.buffers)
        // inc count to draw visible.
        this.incrementInstanceCount()
    }

    setInstanceBuffersIndex(node: TransformNode, slot: number): void {
        const index = node.location.index
        setInstanceMatrixAt(
            this.buffers.instanceMatrix,
            index,
            node.compoundMatrix
        )
        setUintAttributeAt(this.buffers.nodeSlot, index, slot)
        updateBufferRanges(index, this.buffers)
    }

    computeBoundingSphere(): void {
        this.instances.mesh.computeBoundingSphere()
        // this.instances.line.computeBoundingSphere()
        // this.instances.dash.computeBoundingSphere()
        // this.instances.proj.computeBoundingSphere()
    }

    patch(geometry: THREE.BufferGeometry): InstanceItem {
        const geometries = brushCleaner(geometry)
        const { mesh, line, outline, dash, proj, fold } = this.instances
        const nodeSlot = this.buffers.nodeSlot

        if (activeMaterialLib === "gl_Line") {
            line.geometry.dispose()
            line.geometry = geometries.lineGeometry
            outline.geometry.dispose()
            outline.geometry = geometries.lineGeometry
        } else {
            const nextLineGeometry =
                new LineSegmentsGeometry().fromEdgesGeometry(
                    geometries.lineGeometry
                )
            const nextOutlineGeometry = new DataTextureLineSegmentsGeometry(
                geometries.lineGeometry
            )

            line.geometry.dispose()
            line.geometry = nextLineGeometry
            outline.geometry.dispose()
            outline.geometry = nextOutlineGeometry
        }
        mesh.geometry.dispose()
        mesh.geometry = geometries.meshGeometry
        dash.geometry.dispose()
        dash.geometry = geometries.lineGeometry
        proj.geometry.dispose()
        proj.geometry = geometries.projGeometry
        dash.computeLineDistances()

        //set node slot
        mesh.geometry.setAttribute("nodeSlot", nodeSlot)
        dash.geometry.setAttribute("nodeSlot", nodeSlot)
        proj.geometry.setAttribute("nodeSlot", nodeSlot)
        fold.geometry.setAttribute("nodeSlot", nodeSlot)

        geometries.brush.matrixAutoUpdate = false
        this.brush = geometries.brush
        this.geometry = geometry
        this.computeBoundingSphere()
        return this
    }
}
