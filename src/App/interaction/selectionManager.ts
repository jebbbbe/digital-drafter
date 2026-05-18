import type { Mesh } from "three"
import type { TransformNode } from "../draft/TransformNode"
import type { Drafter } from "../draft/Drafter"
import { getSlotIndex } from "../objects/textures/GlobalTreeTexture"

export type SectionSegment = {
    object: Mesh
    index: number
}
export type SelectObject =
    | {
          type: "TransformNode"
          target: TransformNode
      }
    | {
          type: "SectionSegment"
          target: SectionSegment
      }

export class SelectionManager {
    selection: SelectObject[]
    drafter: Drafter
    constructor(drafter: Drafter, array: SelectObject[] = []) {
        this.selection = array
        this.drafter = drafter
    }
    setSelectedUpdate(object: SelectObject, isSelected: boolean) {
        if (object.type === "TransformNode") {
            const node = object.target
            const slot = getSlotIndex(node.location)
            this.drafter.globalTreeTexture.writeNodeSelected(slot, isSelected)
            this.drafter.globalTreeTexture.sendUpdate(slot)
        } else {
            console.warn("not implemented Select for ", object)
        }
    }
    push(item: SelectObject) {
        this.setSelectedUpdate(item, true)
        return this.selection.push(item)
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
        if (item !== undefined) this.setSelectedUpdate(item, true)
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
    fisrt() {
        return this.selection[0]
    }
    firstTarget(search: "TransformNode"): TransformNode | undefined
    firstTarget(search: "SectionSegment"): SectionSegment | undefined
    firstTarget(search?: SelectObject["type"]) {
        const item = this.selection[0]
        if (!item) return undefined
        if (search === undefined) return item.target
        if (item.type !== search) return undefined
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
}
