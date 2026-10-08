import type { Intersection } from "three"
import type { AppContext } from "../AppContext"
import type { InteractiveTarget } from "./index"

export function getInteractiveObject(
    hit: Intersection,
    { drafter, sectionCutter }: Pick<AppContext, "drafter" | "sectionCutter">
): InteractiveTarget | undefined {
    const { object, instanceId, index, faceIndex } = hit
    if (object.userData.interactiveInstances) {
        return instanceId === undefined
            ? undefined
            : object.userData.interactiveInstances[instanceId]
    }
    if (object.userData.interactiveObject) {
        return object.userData.interactiveObject
    }
    if (object === sectionCutter.mesh) {
        const segmentIndex = index ?? (faceIndex != null ? faceIndex * 2 : undefined)
        return segmentIndex === undefined
            ? undefined
            : sectionCutter.attachments[segmentIndex]
    }
    const id = object.userData.id
    if (typeof id !== "number" || instanceId === undefined) return
    return drafter.findNode({ id, index: instanceId })
}
