import * as THREE from "three"
export const maxUpdateRanges = 128 // could use a % of total buffer count, this hsould be fine

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
    return texture
}

/**
 * Writes a matrix into an instanced matrix buffer at the given slot.
 *
 * This only serializes the matrix into the backing typed array. Call
 * `updateBufferRanges()` or set `instanceMatrix.needsUpdate = true` yourself so
 * Three.js uploads the written range to the GPU.
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
    matrix.toArray(instanceMatrix.array, index * 16)
}

export function setUintAttributeAt(
    attribute: THREE.InstancedBufferAttribute,
    index: number,
    value: number
) {
    attribute.array[index] = value
}

/**
 * Marks the per-instance matrix buffers and parent lookup buffer dirty.
 *
 * Adds a narrow update range for one instance when the queued range count is
 * still below `maxUpdateRanges`. Once that threshold is reached, all queued
 * ranges are cleared so the next upload falls back to a full-buffer update.
 * This keeps many small edits from building up an excessively large range list.
 *
 * @param index - Instance slot whose data was modified.
 * @param buffers - Related GPU-backed buffers that must stay in sync.
 * @param buffers.instanceMatrix - Attribute storing one serialized mat4 per instance.
 * @param buffers.dataTexture - Texture view over the same matrix data for random shader reads.
 */
export function updateBufferRanges(
    index: number,
    {
        instanceMatrix,
    }: {
        instanceMatrix: THREE.InstancedBufferAttribute
    }
) {
    if (instanceMatrix.updateRanges.length >= maxUpdateRanges) {
        instanceMatrix.clearUpdateRanges()
    } else {
        const offset = index * 16
        instanceMatrix.addUpdateRange(offset, 16)
    }
    instanceMatrix.needsUpdate = true
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
