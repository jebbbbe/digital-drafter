import * as THREE from "three"
import { InstanceCount } from "../../constants"
import type { NodeLocation, TransformNode } from "@types"

type Pow2 =
    | 1
    | 2
    | 4
    | 8
    | 16
    | 32
    | 64
    | 128
    | 256
    | 512
    | 1024
    | 2048
    | 4096
    | 8192
    | 16384

type FixedLengthArray<
    T,
    N extends number,
    R extends T[] = [],
> = R["length"] extends N ? R : FixedLengthArray<T, N, [...R, T]>

type SlotData = FixedLengthArray<number, 20>
type MatrixData = FixedLengthArray<number, 16>
type JustData = FixedLengthArray<number, 4>

const defaultSlot: SlotData = [
    // ...new THREE.Matrix4().setPosition(3, 0, 3).elements,
    ...new THREE.Matrix4().elements,
    0, // parent slot
    0, // is selected
    0, // unused
    0, // unused
]

/**
 * Stores per-instance slot data in a growable square float texture for shader lookup.
 */
export class GlobalTreeTexture {
    stride = 16 + 4 // 16 matrix + 4 metadata floats
    texelsPerSlot = this.stride / 4
    blockCount = 0

    maxTextureSize: number
    blockSize: number
    textureSize: number
    capacity: number
    array: Float32Array
    blockMax = 0
    texture!: THREE.DataTexture

    /**
     * Creates a power-of-2 square data texture sized to hold the initial slot capacity.
     */
    constructor({
        maxTextureSize = 1024,
        initalSize = 256 as Pow2,
        blockSize = InstanceCount,
    }) {
        this.maxTextureSize = maxTextureSize
        if (initalSize > maxTextureSize) {
            throw new Error(
                `Initial texture size ${initalSize} exceeds max ${maxTextureSize}`
            )
        }
        this.blockSize = blockSize
        this.textureSize = initalSize
        this.capacity = this.getCapacityForTextureSize(this.textureSize)
        this.array = this.createArray(this.capacity)
        this.blockMax = Math.floor(this.capacity / this.blockSize)
        this.texture = this.createTexture()
    }

    getCapacityForTextureSize(size: number) {
        return Math.floor((size * size) / this.texelsPerSlot)
    }

    /**
     * Allocates a slot buffer and fills every slot with the default.
     */
    createArray(capacity = this.capacity) {
        const array = new Float32Array(capacity * this.stride)

        for (let slot = 0; slot < capacity; slot++) {
            array.set(defaultSlot, slot * this.stride)
        }

        return array
    }

    /**
     * Builds a `DataTexture` from the current slot buffer using the current square texture size.
     */
    createTexture() {
        const padded = new Float32Array(this.textureSize * this.textureSize * 4)

        padded.set(this.array)

        this.array = padded

        const texture = new THREE.DataTexture(
            padded,
            this.textureSize,
            this.textureSize,
            THREE.RGBAFormat,
            THREE.FloatType
        )
        // texture.internalFormat = "RGB32F"
        texture.magFilter = THREE.NearestFilter
        texture.minFilter = THREE.NearestFilter
        texture.wrapS = THREE.ClampToEdgeWrapping
        texture.wrapT = THREE.ClampToEdgeWrapping
        texture.generateMipmaps = false
        texture.needsUpdate = true

        return texture
    }

    decBlockCount() {
        this.blockCount--
    }

    incBlockCount(): number {
        this.blockCount++

        if (this.blockCount * this.blockSize > this.capacity) {
            if (this.textureSize >= this.maxTextureSize) {
                console.error(
                    `Texture size ${this.textureSize} reached max ${this.maxTextureSize}`
                )
                this.blockCount--
                return -1
            }

            this.grow()
            return 1
        }

        return 0
    }

    /**
     * Doubles the square texture size, reallocates the slot buffer, and preserves existing data.
     */
    private grow() {
        const oldArray = this.array
        this.textureSize *= 2
        this.capacity = this.getCapacityForTextureSize(this.textureSize)
        this.blockMax = Math.floor(this.capacity / this.blockSize)
        this.array = this.createArray(this.capacity)
        this.array.set(oldArray)
        this.texture.dispose()
        this.texture = this.createTexture()
        // console.log("grew to", this.capacity)
    }

    /**
     * Writes one full slot payload into the backing array at the given global slot.
     */
    writeSlot(slot: number, matrixAndMetaData: SlotData) {
        const offset = slot * this.stride
        this.array.set(matrixAndMetaData, offset)
    }
    writeMatrix(slot: number, matrix: MatrixData) {
        const offset = slot * this.stride
        this.array.set(matrix, offset)
    }
    writeData(slot: number, MetaData: JustData) {
        const offset = slot * this.stride + 16 // add matrix len
        this.array.set(MetaData, offset)
    }
    writeNodeParent(slot: number, parentSlot: number) {
        const offset = slot * this.stride + 16
        this.array[offset] = parentSlot
    }
    writeNodeSelected(slot: number, isSelected: boolean) {
        const offset = slot * this.stride + 16 + 1
        this.array[offset] = Number(isSelected)
    }
    sendUpdate(slot: number) {
        // if this bottlecks, see how we handled updateRanges for the shared Matrix Buffer
        this.texture.needsUpdate = true
    }
    setNodeTextureAt(node: TransformNode) {
        const slot = getSlotIndex(node.location)
        const parentSlot = getSlotIndex(node.parent.location)
        this.writeMatrix(slot, node.compoundMatrix.elements)
        this.writeData(slot, [parentSlot, Number(node.selected), 0, 0])
        this.sendUpdate(slot)
        return slot
    }
}

/**
 * Converts a block-local instance location into its flat global slot index.
 */
export function getSlotIndex({ id, index }: NodeLocation): number {
    return id * InstanceCount + index
}

export function getNodeLocationFromSlot(slotIndex: number): NodeLocation {
    const id = Math.floor(slotIndex / InstanceCount)
    const index = slotIndex % InstanceCount
    return { id, index }
}
