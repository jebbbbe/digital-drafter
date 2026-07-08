import * as THREE from "three"
import type { TransformNode } from "../draft/TransformNode"
import { NodeSelectionObject } from "./NodeSelectionObject"
import {
    SegmentSelectionObject,
    type SectionSegment,
} from "./SegmentSelectionObject"

import type { SelectType } from "./SelectionObject"

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

export type SelectObject = NodeSelectionObject | SegmentSelectionObject
type SelectionKey = TransformNode | SectionSegment | number
type SelectionRunItem = SelectObject | TransformNode | SectionSegment
type SelectionTargetKind = "TransformNode" | "SectionSegment"
interface SelectionOperation<TItem = unknown> {
    begin?(selection: TItem[]): void
    apply(item: TItem, index: number, selection: TItem[]): void
    end?(selection: TItem[]): void
}

export class SelectionManager {
    map: Map<SelectionKey, SelectObject>
    averagePosition = new AveragePosition()
    constructor(array: SelectObject[] = []) {
        this.map = new Map()
    }
    items() {
        return [...this.map.values()]
    }

    filterObjects(kind: "TransformNode"): NodeSelectionObject[]
    filterObjects(kind: "SectionSegment"): SegmentSelectionObject[]
    filterObjects(kind: SelectionTargetKind): SelectObject[] {
        switch (kind) {
            case "TransformNode":
                return this.items().filter(
                    (item) => item instanceof NodeSelectionObject
                )
            case "SectionSegment":
                return this.items().filter(
                    (item) => item instanceof SegmentSelectionObject
                )
            default:
                return []
        }
    }

    filterTargets(kind: "TransformNode"): TransformNode[]
    filterTargets(kind: "SectionSegment"): SectionSegment[]
    filterTargets(
        kind: SelectionTargetKind
    ): TransformNode[] | SectionSegment[] {
        switch (kind) {
            case "TransformNode":
                return this.filterObjects(kind).map((item) => item.target)
            case "SectionSegment":
                return this.filterObjects(kind).map((item) => item.target)
        }
    }
    run<TItem extends SelectionRunItem = SelectObject>(
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
    setSelectedUpdate(object: SelectObject, isSelected: boolean) {
        /*
		if we are hiding a SectionSegment, need to check if its parent is in selection and leep it active.
		if(){
			return	
		}
		*/
        object.setSelected(isSelected)
    }
    add(item: SelectObject): boolean {
        const target = (item.target as any).index ?? item.target
        if (!this.map.has(target)) {
            this.setSelectedUpdate(item, true)
            this.averagePosition.addToAverage(item.getCenter())
            this.map.set(target, item)
            return true
        }
        return false
    }
    remove(item: SelectObject): boolean {
        const target = (item.target as any).index ?? item.target
        if (this.map.has(target)) {
            this.setSelectedUpdate(item, false)
            this.averagePosition.removeFromAverage(item.getCenter())
            this.map.delete(target)
            return true
        }
        return false
    }
    has(item: SelectObject): boolean {
        const target = (item.target as any).index ?? item.target
        return this.map.has(target)
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
    firstTarget(search: "SectionSegment"): SectionSegment | undefined
    firstTarget(
        search: Exclude<SelectType, "SectionSegment">
    ): TransformNode | undefined
    firstTarget(search?: SelectType) {
        const item = this.first()
        if (!item) return undefined
        if (search === undefined) return item.target
        if (item.kind !== search) return undefined
        return item.target
    }
    // get fisrt item if its a node,
    firstNode(): TransformNode | undefined {
        const item = this.first()
        if (!item || !(item instanceof NodeSelectionObject)) return
        return item.target
    }
    firstSegment(): SectionSegment | undefined {
        const item = this.first()
        if (!item || !(item instanceof SegmentSelectionObject)) return
        return item.target
    }
    transformCallback() {
        const object = this.first()
        if (object) {
            object.gizmoListener()
        }
    }
}
