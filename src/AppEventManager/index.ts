import * as ctx from "../App/AppContext"
import { init as initApp } from "../App/main"
import { AppEventManager } from "./AppEventManager"
import * as Tools from "./ToolRegistry"
import { setToolSwitcher } from "./state"

import { controls } from "../App/controls/controls"
import { constants, themeOptions } from "../App/constants"
import { geometryTitles } from "../App/objects/geometries/library"

export async function linkThreeApp(container: HTMLElement) {
    const disposeApp = initApp(container)
    const registry = new Tools.ToolRegistry()
    registry.register("move", new Tools.MoveTool(ctx))
    registry.register("select", new Tools.SelectTool(ctx))
    registry.register("insert", new Tools.InsertTool(ctx))

    const events = new AppEventManager(ctx, registry, "select")
    setToolSwitcher(events)

    ;(globalThis as any).ctx = ctx
    console.log(ctx)

    return {
        bridge: {
            controls,
            constants,
            themeOptions,
            geometryTitles,
        },
        dispose: () => {
            setToolSwitcher(undefined)
            events.dispose()
            disposeApp()
        },
    }
}
