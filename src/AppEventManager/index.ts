import * as ctx from "../App/AppContext"
import { init as initApp } from "../App/main"
import { AppEventManager } from "./AppEventManager"
import * as Tools from "./ToolRegistry"

export { controls } from "../App/controls/controls"
export { constants, themeOptions } from "../App/constants"
export { geometryTitles } from "../App/objects/geometries/library"

export function init(container: HTMLElement): () => void {
    const disposeApp = initApp(container)
    const registry = new Tools.ToolRegistry()
    registry.register("move", new Tools.MoveTool(ctx))
    registry.register("select", new Tools.SelectTool(ctx))

    const events = new AppEventManager(ctx, registry, "select")

    return () => {
        events.dispose()
        disposeApp()
    }
}
