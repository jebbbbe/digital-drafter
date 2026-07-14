import { Tool, type NormalizedPointerEvent } from "./Tool"
import { deSelectAll } from "../../App/controls/interaction"

type SelectNodesEnterArgs = [
    targetCount: number,
    resolve?: () => void,
    reject?: () => void,
]

export class SelectNodesTool extends Tool {
    private targetCount = 0
    private resolve?: () => void
    private reject?: () => void

    override enter(...args: unknown[]): void {
        const [targetCount, resolve, reject] = args as SelectNodesEnterArgs
        this.targetCount = targetCount
        this.resolve = resolve
        this.reject = reject
        this.ctx.controllers.detachTransformControls()
        this.ctx.controllers.pauseControls()

        if (this.ctx.selection.size >= this.targetCount) {
            this.finish()
        }
    }

    override onPointerUp(_normalized: NormalizedPointerEvent) {
        if (!this.resolve) return

        const e = _normalized.event
        const { drafter, raycastHelper, selection } = this.ctx

        if (e.pointerType === "touch" && !e.isPrimary) return

        const intersects = raycastHelper.castFromEvent(e)
        if (intersects.length === 0) {
            return
        }

        const first = intersects[0]
        const id = first.object.userData.id
        const index = first.instanceId
        if (id === undefined || index === undefined) {
            return
        }

        const node = drafter.findNode({ id, index })
        if (!node) return

        let removed = false
        let added = false

        if (e.ctrlKey) {
            removed = selection.remove(node)
        } else {
            added = selection.add(node)
        }

        if (
            !removed &&
            selection.filter("TransformNode").length >= this.targetCount
        ) {
            this.finish()
        }
    }

    override onPointerCancel() {
        this.cancel()
        this.eventManager.setTool("select")
    }

    override onKeyDown(event: KeyboardEvent): boolean {
        if (event.key !== "Escape") return false

        this.cancel()
        this.eventManager.setTool("select")
        return true
    }

    override cancel(): void {
        if (!this.resolve) return

        this.targetCount = 0
        deSelectAll()
        this.resolve = undefined
        this.reject?.()
        this.reject = undefined
    }

    private finish() {
        if (!this.resolve) return

        const resolve = this.resolve
        this.targetCount = 0
        this.ctx.controllers.resumeControls()
        this.resolve = undefined
        this.reject = undefined

        resolve?.()
    }
}
