/**
 * Fixed-capacity packed array that supports O(1) removal by moving the last
 * live item into the removed slot.
 */
export class PackedArray<T> extends Array<T | undefined> {
    count: number = 0

    constructor(capacity: number) {
        super(capacity)
    }

    resize(capacity: number) {
        if (capacity < this.count) {
            throw new Error("PackedArray resize cannot shrink below count")
        }
        this.length = capacity
    }

    push(item: T): number {
        if (this.count >= this.length) {
            console.error("Packed Array capacity exceeded")
            return -1
        }
        this[this.count] = item
        this.count++
        return this.count - 1
    }

    pop(): T | undefined {
        if (this.count === 0) return undefined
        const item = this[this.count - 1]
        this[this.count - 1] = undefined
        this.count--
        return item
    }

    free(index: number): T | undefined {
        if (index < 0 || index >= this.count) return undefined
        const removed = this[index]
        this.swap(index)
        this.count--
        return removed
    }

    remove(index: number): T | undefined {
        if (index < 0 || index >= this.count) return undefined
        const removed = this[index]
        const lastIndex = this.swap(index)
        this[lastIndex] = undefined
        this.count--
        return removed
    }

    swap(index: number): number {
        const last = this.count - 1
        ;[this[index], this[last]] = [this[last], this[index]]
        return last
    }
}

/**
 * Fixed-capacity packed array that supports O(1) removal by moving the last
 * live item into the removed slot.
 */
/*
export class PackedArray<T> {
    array!: Array<T | undefined>
    private count: number = 0
    constructor(length: number) {
        this.array = new Array<T | undefined>(length)
    }
    get length(): number {
        return this.array.length
    }
    set length(len: number) {
        this.array.length = len
        if (len < this.count) this.count = len
    }
    get(index: number): T | undefined {
        if (index < 0 || index >= this.count) return undefined
        return this.array[index]
    }
    push(item: T): undefined {
        if (this.count >= this.array.length) {
            console.error("PackedArray capacity exceeded")
            return undefined
        }
        this.array[this.count] = item
        this.count++
    }
    pop(): T | undefined {
        if (this.count === 0) return undefined
        const item = this.array[this.count - 1]
        this.array[this.count - 1] = undefined
        this.count--
        return item
    }
    remove(index: number): T | undefined {
        if (index < 0 || index >= this.count) return undefined
        const removed = this.array[index]
        const lastIndex = this.count - 1
        this.array[index] = this.array[lastIndex]
        this.array[lastIndex] = undefined
        this.count--
        return removed
    }
}
*/
