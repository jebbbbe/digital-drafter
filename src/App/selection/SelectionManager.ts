import * as THREE from "three"
import { TransformNode } from "../objects/attachments"
import { SegmentAttachment } from "../objects/attachments"
import type { InteractiveObject, SelectType } from "./SelectionObject"

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

type SelectionRunItem = InteractiveObject | TransformNode | SegmentAttachment
type SelectionTargetKind = "TransformNode" | "SectionSegment"
interface SelectionOperation<TItem = unknown> {
    begin?(selection: TItem[]): void
    apply(item: TItem, index: number, selection: TItem[]): void
    end?(selection: TItem[]): void
}

export class SelectionManager {
    map: Map<InteractiveObject, InteractiveObject>
    averagePosition = new AveragePosition()
    constructor(array: InteractiveObject[] = []) {
        this.map = new Map()
    }
    get size(): number {
        return this.map.size
    }
    items() {
        return [...this.map.values()]
    }

    filterObjects(kind: "TransformNode"): TransformNode[]
    filterObjects(kind: "SectionSegment"): SegmentAttachment[]
    filterObjects(kind: SelectionTargetKind): InteractiveObject[] {
        switch (kind) {
            case "TransformNode":
                return this.items().filter(
                    (item) => item instanceof TransformNode
                )
            case "SectionSegment":
                return this.items().filter(
                    (item) => item instanceof SegmentAttachment
                )
            default:
                return []
        }
    }

    filterTargets(kind: "TransformNode"): TransformNode[]
    filterTargets(kind: "SectionSegment"): SegmentAttachment[]
    filterTargets(
        kind: SelectionTargetKind
    ): TransformNode[] | SegmentAttachment[] {
        switch (kind) {
            case "TransformNode":
                return this.filterObjects(kind).map((item) => item)
            case "SectionSegment":
                return this.filterObjects(kind).map((item) => item)
        }
    }
    run<TItem extends SelectionRunItem = InteractiveObject>(
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
        /*
		if we are hiding a SectionSegment, need to check if its parent is in selection and leep it active.
		if(){
			return	
		}
		*/
        object.setSelected(isSelected)
    }
    add(item: InteractiveObject): boolean {
        const target = item
        if (!this.map.has(target)) {
            this.setSelectedUpdate(item, true)
            this.averagePosition.addToAverage(item.getCenter())
            this.map.set(target, item)
            return true
        }
        return false
    }
    remove(item: InteractiveObject): boolean {
        const target = item
        if (this.map.has(target)) {
            this.setSelectedUpdate(item, false)
            this.averagePosition.removeFromAverage(item.getCenter())
            this.map.delete(target)
            return true
        }
        return false
    }
    has(item: InteractiveObject): boolean {
        return this.map.has(item)
    }
    clear() {
        for (const item of this.items()) {
            this.setSelectedUpdate(item, false)
        }
        this.averagePosition.resetAverage()
        this.map.clear()
    }

    first() {
        return this.items()[0]
    }
    firstTarget(search: "SectionSegment"): SegmentAttachment | undefined
    firstTarget(
        search: Exclude<SelectType, "SectionSegment">
    ): TransformNode | undefined
    firstTarget(search?: SelectType) {
        const item = this.first()
        if (!item) return undefined
        if (search === undefined) return item
        if (item.kind !== search) return undefined
        return item
    }
    // get fisrt item if its a node,
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
    transformCallback() {
        const object = this.first()
        if (object) {
            object.gizmoListener()
        }
    }
}
