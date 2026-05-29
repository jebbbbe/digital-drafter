import type {
    SelectObject,
    SectionSegment,
} from "../interaction/selectionManager"
import type { TransformNode } from "../draft/TransformNode"
import { pruneNode, detachNode } from "./nodes"
import { deleteSegment } from "./section"
import { interactionManager } from "../main"

function noop(o: SelectObject) {
    console.warn("noop", o)
}

function deleteNodeFromObject(object: SelectObject) {
    const node = object.target as TransformNode
    interactionManager.deselectAll()
    pruneNode(node)
}

function detachNodeFromObject(object: SelectObject) {
    const node = object.target as TransformNode
    detachNode(node)
}

const fnLib = {
    // add:{},
    // move:{},
    // prune:{},
    delete: {
        SectionSegment: (object: SelectObject) => {
            const line = object.target as SectionSegment
            deleteSegment(line)
        },
        leaf: deleteNodeFromObject,
        root: deleteNodeFromObject,
        sectionChild: deleteNodeFromObject,
        sectionParent: deleteNodeFromObject,
    },
    detach: {
        SectionSegment: noop,
        leaf: detachNodeFromObject,
        root: detachNodeFromObject,
        sectionChild: detachNodeFromObject,
        sectionParent: detachNodeFromObject,
    },
}

function runTypedfn(
    key: keyof typeof fnLib,
    object: SelectObject = interactionManager.selection.first()
) {
    if (!object) return
    console.log({ object })
    fnLib[key][object.kind](object)
}

export const deleteFirstObject = (o?: SelectObject) => runTypedfn("delete", o)
export const detachFirstObject = (o?: SelectObject) => runTypedfn("detach", o)
