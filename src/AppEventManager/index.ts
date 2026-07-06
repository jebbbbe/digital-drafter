import { init } from "../App/main"
import { themeOptions } from "../App/constants"
import { geometryTitles } from "../App/objects/geometries/library"
import { controls } from "../App/controls/controls"
import * as ctx from "../App/AppContext"
import * as Tools from "./ToolRegistry"
import { settings } from "../App/settings"

export async function linkThreeApp(container: HTMLElement) {
    // set up app
    const disposeApp = init(container)

    // link tools to evvent manager
    const { eventManager } = ctx
    eventManager.register("select", new Tools.SelectTool(ctx, eventManager))
    eventManager.register("insert", new Tools.InsertTool(ctx, eventManager))
    eventManager.setContext(ctx, "select")

    // set up the sccene
    controls.setUpDrafter()

    // add context for logging
    ;(globalThis as any).ctx = ctx
    console.log(ctx)
    if (import.meta.env.DEV) {
        console.log("DEV")
    }

    return {
        bridge: {
            controls,
            settings,
            themeOptions,
            geometryTitles,
        },
        dispose: () => {
            eventManager.dispose()
            disposeApp()
        },
    }
}
