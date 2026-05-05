import * as THREE from "three"
import { BufferGeometryUtils } from "three/addons"
import { doublePositionBuffer } from "../buffers/buffers"

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
    if (settings.removeAttributes) {
        geometry.deleteAttribute("uv")
        geometry.deleteAttribute("normal")
    }

    if (settings.mergeVertices) {
        geometry = BufferGeometryUtils.mergeVertices(
            geometry,
            settings.mergeTolerance
        )
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
        projGeometry = BufferGeometryUtils.mergeVertices(
            projGeometry,
            settings.mergeTolerance
        )
    }
    projGeometry = doublePositionBuffer(projGeometry)
    return {
        meshGeometry,
        lineGeometry,
        projGeometry,
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
    // directly modify the buffer
    // geometry.translate(-center.x, -center.y, -center.z)
    // geometry.scale(
    //     1 / largestDimension,
    //     1 / largestDimension,
    //     1 / largestDimension
    // )
    // geometry.computeBoundingBox()
    result.makeTranslation(-center.x, -center.y, -center.z)
    _vec.set(1 / largestDimension, 1 / largestDimension, 1 / largestDimension)
    result.scale(_vec)

    return result
}
