import { controls } from "../../App/controls/controls"

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
            controls.addLeafToSelectedNodes()
        }
    } else if (keyEvent.key === "Escape") {
        if (keyEvent.repeat) return
        controls.deSelectAll()
    }
}

export const handleKeyboardUp = (keyEvent: KeyboardEvent) => {
    // console.log(keyEvent)
    if (keyEvent.key === " ") {
        // reset hold counter for space
        spaceHoldCurr = 0
    }
}
