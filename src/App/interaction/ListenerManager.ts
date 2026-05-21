import type { TransformControls } from "three/examples/jsm/controls/TransformControls.js"

type ActiveEvent = {
    target: HTMLCanvasElement | TransformControls | Window
    type: string
    listener: Function
}

export class ListenerManager {
    domElement: HTMLCanvasElement
    activeEvents: Partial<Record<string, ActiveEvent>> = {}
    constructor(elem: HTMLCanvasElement) {
        this.domElement = elem
    }
    addActiveEvent(
        name: string,
        type: string,
        listener: Function,
        target: HTMLCanvasElement | TransformControls | Window = this.domElement
    ) {
        this.removeActiveEvent(name)
        ;(target as any).addEventListener(type, listener)
        const event = { target, type, listener } as ActiveEvent
        this.activeEvents[name] = event
        return event
    }

    removeActiveEvent(name: string) {
        const event = this.activeEvents[name]
        if (!event) return
        ;(event.target as any).removeEventListener(event.type, event.listener)
        delete this.activeEvents[name]
    }

    removeAllActiveEvents() {
        for (const name in this.activeEvents) {
            this.removeActiveEvent(name)
        }
    }
}
