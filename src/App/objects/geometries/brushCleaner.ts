import * as THREE from "three"
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js"
import { doublePositionBuffer } from "../buffers/buffers"
import { newFoldLineGeometry } from "./FoldLineGoemetry"
import { Brush } from "three-bvh-csg"

const defaultGeoProcess = {
    mergeTolerance: 1e-2,
    edgeAngle: 3,
    removeAttributes: true,
    mergeVertices: true,
    computeNormals: true,
    removeProjVertices: true, // 60ms v 220ms speed up
    applyLocalTranform: !true,
}

export function brushCleaner(
    geometry: THREE.BufferGeometry = new THREE.BoxGeometry(1, 1, 1),
    settings = defaultGeoProcess
) {
    const brush = new Brush(geometry.clone())
    if (settings.removeAttributes) {
        geometry.deleteAttribute("uv")
        geometry.deleteAttribute("normal")
    }
	brush.matrixAutoUpdate = false

    if (settings.mergeVertices) {
        geometry = mergeVertices(geometry, settings.mergeTolerance)
    }

    if (settings.computeNormals) {
        geometry.computeVertexNormals()
    }

    const localTransform = new THREE.Matrix4()
    normalizeGeometryBox(geometry, localTransform)

    if (settings.applyLocalTranform) {
        geometry.applyMatrix4(localTransform)
        geometry.computeBoundingBox()
        localTransform.identity()
    }

    const meshGeometry = geometry
    const lineGeometry = new THREE.EdgesGeometry(geometry, settings.edgeAngle)

    let projGeometry: THREE.BufferGeometry = lineGeometry.clone()
    if (settings.removeProjVertices) {
        projGeometry = mergeVertices(projGeometry, settings.mergeTolerance)
    }
    projGeometry = doublePositionBuffer(projGeometry)

    return {
        meshGeometry,
        lineGeometry,
        projGeometry,
        foldGeometry: newFoldLineGeometry(),
        brush,
        localTransform,
    }
}

const _vec = new THREE.Vector3()
function normalizeGeometryBox(
    geometry: THREE.BufferGeometry,
    result = new THREE.Matrix4()
): THREE.Matrix4 {
    geometry.computeBoundingBox()
    const boundingBox = geometry.boundingBox
    if (!boundingBox) {
        return result
    }

    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    boundingBox.getSize(size)
    boundingBox.getCenter(center)

    const largestDimension = Math.max(size.x, size.y, size.z)
    if (largestDimension === 0) {
        return result
    }

    const s = 1 / largestDimension
    const translate = new THREE.Matrix4().makeTranslation(
        -center.x,
        -center.y,
        -center.z
    )
    const scale = new THREE.Matrix4().makeScale(s, s, s)
    result.copy(scale).multiply(translate)

    return result
}
