//  pull out all geometry processing frim interaction manager to here.
//  use userdata for interaciton types to determine which file to ccall.
//
import type {
    SelectObject,
    SectionSegment,
} from "../interaction/selectionManager"
import type { TransformNode } from "../draft/TransformNode"
import { pruneNode } from "./nodes"
import { deleteSegment } from "./section"
import { interactionManager } from "../main"

export function deleteFistObject(
    object: SelectObject = interactionManager.selection.first()
) {
    if (!object) return

    switch (object.type) {
        case "TransformNode":
            const node = object.target as TransformNode
            pruneNode(node)
            interactionManager.onDeleteSelection()
            break
        case "SectionSegment":
            const line = object.target as SectionSegment
            deleteSegment(line)
            // skip unless we attach gizmo to this..
            // interactionManager.onDeleteSelection()
            break
    }
}
