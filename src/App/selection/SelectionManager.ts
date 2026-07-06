import type { TransformNode } from "../draft/TransformNode"
import { NodeSelectionObject } from "./NodeSelectionObject"
import {
    SegmentSelectionObject,
    type SectionSegment,
} from "./SegmentSelectionObject"

import type { SelectType } from "./SelectionObject"

export type SelectObject = NodeSelectionObject | SegmentSelectionObject

type SelectionRunItem = SelectObject | TransformNode | SectionSegment
type SelectionTargetKind = "TransformNode" | "SectionSegment"
interface SelectionOperation<TItem = unknown> {
    begin?(selection: TItem[]): void
    apply(item: TItem, index: number, selection: TItem[]): void
    end?(selection: TItem[]): void
}

export class SelectionManager {
    selection: SelectObject[]
    constructor(array: SelectObject[] = []) {
        this.selection = array
    }

    filterObjects(kind: "TransformNode"): NodeSelectionObject[]
    filterObjects(kind: "SectionSegment"): SegmentSelectionObject[]
    filterObjects(kind: SelectionTargetKind): SelectObject[] {
        switch (kind) {
            case "TransformNode":
                return this.selection.filter(
                    (item) => item instanceof NodeSelectionObject
                )
            case "SectionSegment":
                return this.selection.filter(
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
        items: TItem[] = this.selection as unknown as TItem[]
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
    push(item: SelectObject): boolean {
        // check if item already in the seleciton
        const hasSeen = this.selection.some((selected) => {
            if (
                selected instanceof NodeSelectionObject &&
                item instanceof NodeSelectionObject
            ) {
                return selected.target === item.target
            }

            if (
                selected instanceof SegmentSelectionObject &&
                item instanceof SegmentSelectionObject
            ) {
                return (
                    selected.target.object === item.target.object &&
                    selected.target.index === item.target.index
                )
            }

            return false
        })

        if (hasSeen) return true

        this.setSelectedUpdate(item, true)
        this.selection.push(item)
        return false
    }
    set(array: SelectObject[]) {
        this.clear()
        for (let i = 0; i < array.length; i++) {
            const item = array[i]
            this.selection[i] = item
            this.setSelectedUpdate(item, true)
        }
    }
    pop() {
        const item = this.selection.pop()
        if (item !== undefined) this.setSelectedUpdate(item, false)
        return item
    }
    shift() {
        const item = this.selection.shift()
        if (item !== undefined) this.setSelectedUpdate(item, false)
        return item
    }
    clear() {
        for (let i = 0; i < this.selection.length; i++) {
            const item = this.selection[i]
            this.setSelectedUpdate(item, false)
        }
        this.selection.length = 0
    }
    first() {
        return this.selection[0]
    }
    firstTarget(search: "SectionSegment"): SectionSegment | undefined
    firstTarget(
        search: Exclude<SelectType, "SectionSegment">
    ): TransformNode | undefined
    firstTarget(search?: SelectType) {
        const item = this.selection[0]
        if (!item) return undefined
        if (search === undefined) return item.target
        if (item.kind !== search) return undefined
        return item.target
    }
    // get fisrt item if its a node,
    firstNode(): TransformNode | undefined {
        const item = this.selection[0]
        if (!item || !(item instanceof NodeSelectionObject)) return
        return item.target
    }
    firstSegment(): SectionSegment | undefined {
        const item = this.selection[0]
        if (!item || !(item instanceof SegmentSelectionObject)) return
        return item.target
    }
    remove(item: SelectObject) {
        const idx = this.selection.indexOf(item)
        if (idx !== -1) {
            const item = this.selection[idx]
            this.setSelectedUpdate(item, false)
            this.selection.splice(idx, 1)
        }
        return item
    }

    transformCallback() {
        const object = this.first()
        if (object) {
            object.gizmoListener()
        }
    }
}
