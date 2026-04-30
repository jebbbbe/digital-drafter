import * as THREE from "three"

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

// this updates the buffer twice, we just need the update ranges to be seperate...
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

/**
 * Duplicates each position in a line geometry so the vertex shader can emit a
 * start and end point for every source vertex.
 *
 * Example input positions `[a, b, c]` become `[a, a, b, b, c, c]`.
 */
export function doublePositionBuffer(geometry: THREE.BufferGeometry) {
    const position = geometry.getAttribute("position")

    if (!position || position.itemSize !== 3) {
        throw new Error(
            "doublePositionBuffer requires a vec3 position attribute"
        )
    }

    const source = position.array as ArrayLike<number>
    const doubled = new Float32Array(source.length * 2)

    let dst = 0
    for (let i = 0; i < source.length; i += 3) {
        doubled[dst + 0] = source[i + 0]
        doubled[dst + 1] = source[i + 1]
        doubled[dst + 2] = source[i + 2]
        doubled[dst + 3] = source[i + 0]
        doubled[dst + 4] = source[i + 1]
        doubled[dst + 5] = source[i + 2]
        dst += 6
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(doubled, 3))
    geometry.setIndex(null)

    return geometry
}
