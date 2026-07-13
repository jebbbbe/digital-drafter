import * as THREE from "three"
import {
    TransformNode,
    SegmentAttachment,
    type InteractiveObject,
} from "../interactive"

export class AveragePosition extends THREE.Vector3 {
    count = 0
    addToAverage(pos: THREE.Vector3) {
        this.multiplyScalar(this.count)
        this.add(pos)
        this.count++
        this.divideScalar(this.count)
    }
    removeFromAverage(pos: THREE.Vector3) {
        if (this.count === 1) {
            this.resetAverage()
            return
        }
        this.multiplyScalar(this.count)
        this.sub(pos)
        this.count--
        this.divideScalar(this.count)
    }
    resetAverage() {
        this.set(0, 0, 0)
        this.count = 0
    }
}

type SelectionTargetKind = "TransformNode" | "SegmentAttachment"
interface SelectionOperation<TItem = unknown> {
    begin?(selection: TItem[]): void
    apply(item: TItem, index: number, selection: TItem[]): void
    end?(selection: TItem[]): void
}

export class SelectionManager {
    set: Set<InteractiveObject>
    averagePosition = new AveragePosition()
    constructor(array: InteractiveObject[] = []) {
        this.set = new Set()
    }

    get size(): number {
        return this.set.size
    }

    items() {
        return [...this.set.values()]
    }

    filter(kind: "TransformNode"): TransformNode[]
    filter(kind: "SegmentAttachment"): SegmentAttachment[]
    filter(kind: SelectionTargetKind): InteractiveObject[] {
        switch (kind) {
            case "TransformNode":
                return this.items().filter(
                    (item) => item instanceof TransformNode
                )
            case "SegmentAttachment":
                return this.items().filter(
                    (item) => item instanceof SegmentAttachment
                )
            default:
                return []
        }
    }

    run<TItem extends InteractiveObject>(
        operation: SelectionOperation<TItem>,
        items: TItem[] = this.items() as unknown as TItem[]
    ) {
        const selection = [...items]
        operation.begin?.(selection)
        for (let i = 0; i < selection.length; i++) {
            operation.apply(selection[i], i, selection)
        }
        operation.end?.(selection)
    }

    setSelectedUpdate(object: InteractiveObject, isSelected: boolean) {
        object.setSelected(isSelected)
    }

    add(item: InteractiveObject): boolean {
        if (!this.set.has(item)) {
            this.setSelectedUpdate(item, true)
            this.averagePosition.addToAverage(item.getCenter())
            this.set.add(item)
            return true
        }
        return false
    }

    remove(item: InteractiveObject): boolean {
        if (this.set.has(item)) {
            this.setSelectedUpdate(item, false)
            this.averagePosition.removeFromAverage(item.getCenter())
            this.set.delete(item)
            return true
        }
        return false
    }

    has(item: InteractiveObject): boolean {
        return this.set.has(item)
    }

    clear() {
        for (const item of this.items()) {
            this.setSelectedUpdate(item, false)
        }
        this.averagePosition.resetAverage()
        this.set.clear()
    }

    first() {
        return this.items()[0]
    }

    firstNode(): TransformNode | undefined {
        const item = this.first()
        if (!item || !(item instanceof TransformNode)) return
        return item
    }

    firstSegment(): SegmentAttachment | undefined {
        const item = this.first()
        if (!item || !(item instanceof SegmentAttachment)) return
        return item
    }
}
