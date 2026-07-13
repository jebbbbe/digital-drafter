import * as THREE from "three"
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js"
import { InstancedLineSegments } from "../objects/meshes/InstancedLineSegments"
import { InstancedLineSegments2 } from "../objects/meshes/InstancedLineSegments2"
import { ProjectionLineMaterial } from "../objects/materials/ProjectionLineMaterial"
import { ProjectionLineMaterial2 } from "../objects/materials/ProjectionLineMaterial2"
import { InstancedLineMaterial } from "../objects/materials/InstancedLineMaterial"
import { FoldLineMaterial2 } from "../objects/materials/FoldLineMaterial2"
import { InstanceCount } from "../constants"
import { brushCleaner } from "../objects/geometries/brushCleaner"
import {
    setInstanceMatrixAt,
    setUintAttributeAt,
    updateBufferRanges,
} from "../objects/buffers/buffers"
import { activeMaterialLib, orders } from "./materialManager"
import { settings } from "../settings"
import type { Brush } from "three-bvh-csg"
import type { TransformNode } from "../objects/attachments"

export class InstanceItem {
    brush: Brush
    geometry: THREE.BufferGeometry
    anchor: THREE.Vector3
    localTransform: THREE.Matrix4 // matches head of tree baseTransform..?
    buffers: {
        instanceMatrix: THREE.InstancedBufferAttribute // keep for raycast
    }
    group: THREE.Group
    instances: {
        mesh: THREE.InstancedMesh
        line:
            | InstancedLineSegments<THREE.LineBasicMaterial>
            | InstancedLineSegments2
        outline:
            | InstancedLineSegments<THREE.LineBasicMaterial>
            | InstancedLineSegments2
        dash:
            | InstancedLineSegments<THREE.LineDashedMaterial>
            | InstancedLineSegments2
        proj:
            | InstancedLineSegments<ProjectionLineMaterial>
            | InstancedLineSegments2
        fold: InstancedLineSegments | InstancedLineSegments2
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

        // see materialManager for notes on this bad practice
        mesh.onBeforeRender = (r, s, c, g, material: any) => {
            material.treeBlockOffset = id
            material.uniformsNeedUpdate = true
        }

        let line:
            | InstancedLineSegments<THREE.LineBasicMaterial>
            | InstancedLineSegments2
        let outline:
            | InstancedLineSegments<THREE.LineBasicMaterial>
            | InstancedLineSegments2
        let dash:
            | InstancedLineSegments<THREE.LineDashedMaterial>
            | InstancedLineSegments2
        let proj:
            | InstancedLineSegments<ProjectionLineMaterial>
            | InstancedLineSegments2
        let fold: InstancedLineSegments | InstancedLineSegments2

        if (activeMaterialLib === "gl_Line") {
            line = new InstancedLineSegments<THREE.LineBasicMaterial>(
                geometries.lineGeometry,
                materials.line,
                capacity
            )
            line.onBeforeRender = (r, s, c, g, material: any) => {
                material.treeBlockOffset = id
                material.uniformsNeedUpdate = true
            }
            outline = new InstancedLineSegments<THREE.LineBasicMaterial>(
                geometries.lineGeometry,
                materials.outline,
                capacity
            )
            outline.onBeforeRender = (r, s, c, g, material: any) => {
                material.treeBlockOffset = id
                material.uniformsNeedUpdate = true
            }
            dash = new InstancedLineSegments<THREE.LineDashedMaterial>(
                geometries.lineGeometry,
                materials.dash,
                capacity
            )
            dash.onBeforeRender = (r, s, c, g, material: any) => {
                material.treeBlockOffset = id
                material.uniformsNeedUpdate = true
            }
            fold = new InstancedLineSegments(
                geometries.foldGeometry,
                materials.fold,
                capacity
            )
            fold.onBeforeRender = (r, s, c, g, material: any) => {
                material.treeBlockOffset = id
                material.uniformsNeedUpdate = true
            }
            proj = new InstancedLineSegments(
                geometries.projGeometry,
                materials.projection,
                capacity
            )
            proj.onBeforeRender = (r, s, c, g, material: any) => {
                material.treeBlockOffset = id
                material.uniformsNeedUpdate = true
            }
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
                const material =
                    line.material as unknown as InstancedLineMaterial
                // this changes for every mesh isntance, otherwise we need multiple materials
                material.treeBlockOffset = id
                // might be abel to set this elsewhere
                material.instanceMatrixCount = Math.max(1, line.count)
                // render feature to look over uniforms changed in this fn
                material.uniformsNeedUpdate = true
                InstancedLineSegments2.prototype.onBeforeRender.call(
                    line,
                    renderer
                )
            }

            const outLineGeometry =
                new LineSegmentsGeometry().fromEdgesGeometry(
                    geometries.lineGeometry
                )
            outline = new InstancedLineSegments2(
                outLineGeometry,
                materials.outline as InstancedLineMaterial,
                capacity
            )
            outline.onBeforeRender = (renderer: THREE.WebGLRenderer) => {
                const material =
                    outline.material as unknown as InstancedLineMaterial
                material.treeBlockOffset = id
                material.instanceMatrixCount = Math.max(1, outline.count)
                material.uniformsNeedUpdate = true
                InstancedLineSegments2.prototype.onBeforeRender.call(
                    outline,
                    renderer
                )
            }

            const dashGeometry = new LineSegmentsGeometry().fromEdgesGeometry(
                geometries.lineGeometry
            )
            dash = new InstancedLineSegments2(
                dashGeometry,
                materials.dash as InstancedLineMaterial,
                capacity
            )
            dash.onBeforeRender = (renderer: THREE.WebGLRenderer) => {
                const material =
                    dash.material as unknown as InstancedLineMaterial
                material.treeBlockOffset = id
                material.instanceMatrixCount = Math.max(1, dash.count)
                material.uniformsNeedUpdate = true
                InstancedLineSegments2.prototype.onBeforeRender.call(
                    dash,
                    renderer
                )
            }

            const projGeometry = new LineSegmentsGeometry().setPositions(
                geometries.projGeometry.getAttribute("position")
                    .array as Float32Array
            )
            proj = new InstancedLineSegments2(
                projGeometry,
                materials.projection as ProjectionLineMaterial2,
                capacity
            )
            proj.onBeforeRender = (renderer: THREE.WebGLRenderer) => {
                const material =
                    proj.material as unknown as ProjectionLineMaterial2
                material.treeBlockOffset = id
                material.instanceMatrixCount = Math.max(1, proj.count)
                material.uniformsNeedUpdate = true
                InstancedLineSegments2.prototype.onBeforeRender.call(
                    proj,
                    renderer
                )
            }

            const foldGeometry = new LineSegmentsGeometry().setPositions(
                geometries.foldGeometry.getAttribute("position")
                    .array as Float32Array
            )
            fold = new InstancedLineSegments2(
                foldGeometry,
                materials.fold as FoldLineMaterial2,
                capacity
            )

            mesh.geometry.computeBoundingBox()

            fold.onBeforeRender = (renderer: THREE.WebGLRenderer) => {
                const material = fold.material as unknown as FoldLineMaterial2
                material.treeBlockOffset = id
                material.instanceMatrixCount = Math.max(1, fold.count)
                material.anchor = this.anchor

                const boundingBox = mesh.geometry.boundingBox as THREE.Box3
                const size = new THREE.Vector3()
                boundingBox.getSize(size)
                const largestDimension = Math.max(size.x, size.y, size.z)
                material.boundingEdge = largestDimension

                material.uniformsNeedUpdate = true
                InstancedLineSegments2.prototype.onBeforeRender.call(
                    fold,
                    renderer
                )
            }
        }

        dash.computeLineDistances()

        //render order
        mesh.renderOrder = orders.mesh
        line.renderOrder = orders.line
        outline.renderOrder = orders.outline
        dash.renderOrder = orders.dash
        proj.renderOrder = orders.proj
        fold.renderOrder = orders.fold

        // need this for raycast
        const instanceMatrix = mesh.instanceMatrix

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
        const display = settings.display.objects
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
        this.anchor = new THREE.Vector3()
        this.localTransform = localTransform
        this.buffers = {
            instanceMatrix,
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
        this.updateAnchor()
    }

    updateAnchor(): THREE.Vector3 {
        this.geometry.computeBoundingBox()
        const boundingBox = this.geometry.boundingBox
        if (!boundingBox) {
            return this.anchor.set(0, 0, 0)
        }
        boundingBox.getCenter(this.anchor)
        return this.anchor
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
        updateBufferRanges(index, this.buffers)
    }

    computeBoundingSphere(): void {
        this.instances.mesh.computeBoundingSphere()
        this.instances.mesh.computeBoundingBox()
    }

    patch(geometry: THREE.BufferGeometry): InstanceItem {
        const geometries = brushCleaner(geometry)
        const { mesh, line, outline, dash, proj, fold } = this.instances

        if (activeMaterialLib === "gl_Line") {
            line.geometry.dispose()
            line.geometry = geometries.lineGeometry
            outline.geometry.dispose()
            outline.geometry = geometries.lineGeometry
            dash.geometry.dispose()
            dash.geometry = geometries.lineGeometry
            proj.geometry.dispose()
            proj.geometry = geometries.projGeometry
            fold.geometry.dispose()
            fold.geometry = geometries.foldGeometry
        } else {
            const nextLineGeometry =
                new LineSegmentsGeometry().fromEdgesGeometry(
                    geometries.lineGeometry
                )
            const nextOutlineGeometry =
                new LineSegmentsGeometry().fromEdgesGeometry(
                    geometries.lineGeometry
                )
            const nextDashGeometry =
                new LineSegmentsGeometry().fromEdgesGeometry(
                    geometries.lineGeometry
                )
            const nextProjGeometry = new LineSegmentsGeometry().setPositions(
                geometries.projGeometry.getAttribute("position")
                    .array as Float32Array
            )
            const nextFoldGeometry = new LineSegmentsGeometry().setPositions(
                geometries.foldGeometry.getAttribute("position")
                    .array as Float32Array
            )

            line.geometry.dispose()
            line.geometry = nextLineGeometry
            outline.geometry.dispose()
            outline.geometry = nextOutlineGeometry
            dash.geometry.dispose()
            dash.geometry = nextDashGeometry
            proj.geometry.dispose()
            proj.geometry = nextProjGeometry
            fold.geometry.dispose()
            fold.geometry = nextFoldGeometry
        }
        mesh.geometry.dispose()
        mesh.geometry = geometries.meshGeometry
        dash.computeLineDistances()

        geometries.brush.matrixAutoUpdate = false
        this.brush = geometries.brush
        this.geometry = geometry
        this.updateAnchor()
        this.computeBoundingSphere()

        return this
    }
}
