import { controls } from "../controls/controls"
import { selection, interactionManager } from "../AppContext"

const spaceHoldMax = 20
let spaceHoldCurr = 0

export const handleKeyboardDown = (keyEvent: KeyboardEvent) => {
    // console.log(keyEvent)
    if (keyEvent.key === "Delete") {
        if (keyEvent.repeat) return
        controls.deleteFirstObject()
    } else if (keyEvent.key === " ") {
        if (spaceHoldCurr < spaceHoldMax) {
            spaceHoldCurr++
            const node = selection.firstNode()
            if (!node) return
            controls.addLeafNearbyRandomlyNicely(node)
        }
    } else if (keyEvent.key === "Escape") {
        if (keyEvent.repeat) return
        interactionManager.deSelectAll()
    }
}

export const handleKeyboardUp = (keyEvent: KeyboardEvent) => {
    // console.log(keyEvent)
    if (keyEvent.key === " ") {
        // reset hold counter for space
        spaceHoldCurr = 0
    }
}
