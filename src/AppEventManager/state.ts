import type { ToolId } from "./ToolRegistry"

type ToolSwitcher = {
    setTool(id: ToolId): void
}

let toolSwitcher: ToolSwitcher | undefined

export function setToolSwitcher(switcher: ToolSwitcher | undefined) {
    toolSwitcher = switcher
}

export function setActiveTool(id: ToolId) {
    toolSwitcher?.setTool(id)
}
