/**
 * Sparse array with reusable indices for items that track their own index.
 *
 * Free slots are tracked in `free`. Insertion pops an available index from that
 * stack so cleared slots can be reused without shifting any live items.
 */
export class FreeList<T> extends Array<T | undefined> {
    private free: number[] = []

    nextIndex(): number {
        return this.free.at(-1) ?? this.length
    }

    push(item: T): number {
        const index = this.free.pop() ?? this.length
        this[index] = item
        if (item === undefined) {
            this.free.push(index)
        }
        return index
    }

    pop(): T | undefined {
        const index = this.length - 1
        const item = super.pop()
        if (item === undefined) {
            const freeIndex = this.free.indexOf(index)
            if (freeIndex !== -1) {
                this.free.splice(freeIndex, 1)
            }
        }
        return item
    }

    remove(index: number): T | undefined {
        if (index < 0 || index >= this.length) return undefined

        const item = this[index]
        if (item === undefined) return undefined

        this.free.push(index)
        this[index] = undefined
        return item
    }

    forEach(
        callbackfn: (
            value: T,
            index: number,
            array: T[]
        ) => void,
        thisArg?: any
    ): void {
        for (let index = 0; index < this.length; index++) {
            const instanceItem = this[index]
            if (!instanceItem) continue
            callbackfn.call(thisArg, instanceItem, index, this as T[])
        }
    }
}
