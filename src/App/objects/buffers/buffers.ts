import * as THREE from "three"
import { array } from "three/tsl"

export const maxUpdateRanges = 256 // could use a % of total buffer count, this hsould be fine

export function createLinkedInstanceMatrixTexture(
    instanceMatrix: THREE.InstancedBufferAttribute | THREE.BufferAttribute
): THREE.DataTexture {
    const texture = new THREE.DataTexture(
        instanceMatrix.array,
        4,
        instanceMatrix.count,
        THREE.RGBAFormat,
        THREE.FloatType
    )
    texture.needsUpdate = true
    texture.magFilter = THREE.NearestFilter
    texture.minFilter = THREE.NearestFilter
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    // texture.flipY = false
    // texture.unpackAlignment = 1

    // texture.generateMipmaps = false
    return texture
}

/**
 * Writes a matrix into an instanced matrix buffer at the given slot.
 *
 * Manages addUpdateRange frequency, no need to set `instanceMatrix.needsUpdate = true`
 *
 * Mirrors the behavior of `THREE.InstancedMesh#setMatrixAt`:
 * https://threejs.org/docs/#api/en/objects/InstancedMesh.setMatrixAt
 *
 * @param instanceMatrix - Backing `InstancedBufferAttribute` for instance matrices.
 * @param index - Instance slot to write.
 * @param matrix - Matrix to serialize into the buffer.
 */
export function setInstanceMatrixAt(
    instanceMatrix: THREE.InstancedBufferAttribute | THREE.BufferAttribute,
    index: number,
    matrix: THREE.Matrix4
) {
    const offset = index * 16
    matrix.toArray(instanceMatrix.array, offset)

    if (instanceMatrix.updateRanges.length >= maxUpdateRanges) {
        instanceMatrix.clearUpdateRanges()
    } else {
        instanceMatrix.addUpdateRange(offset, 16)
    }

    instanceMatrix.needsUpdate = true
}

/**
 * Writes a matrix into an DataTexture at the given slot.
 *
 * Manages addUpdateRange frequency, no need to set `attribute.needsUpdate = true`
 *
 * Mirrors the behavior of `THREE.InstancedMesh#setMatrixAt`:
 * https://threejs.org/docs/#api/en/objects/InstancedMesh.setMatrixAt
 *
 * @param attribute - Backing `InstancedBufferAttribute` for instance matrices.
 * @param index - Instance slot to write.
 * @param matrix - Matrix to serialize into the buffer.
 */
export function setDataTextureMatrixAt(
    attribute: THREE.DataTexture,
    index: number,
    matrix: THREE.Matrix4
) {
    const offset = index * 16
    matrix.toArray(
        attribute.image.data as NonNullable<THREE.TypedArray>,
        offset
    )

    if (attribute.updateRanges.length >= maxUpdateRanges) {
        attribute.clearUpdateRanges()
    } else {
        attribute.addUpdateRange(offset, 16)
    }

    attribute.needsUpdate = true
}
