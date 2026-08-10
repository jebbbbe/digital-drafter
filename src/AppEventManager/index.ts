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
    eventManager.register("disable", new Tools.DisableTool(ctx))
    eventManager.register("select", new Tools.SelectTool(ctx))
    eventManager.register("selectCount", new Tools.CountSelectTool(ctx))
    eventManager.register("moveAttached", new Tools.AttachedMoveTool(ctx))
    eventManager.register("moveNode", new Tools.MoveNodeTool(ctx))
    eventManager.register("moveSegment", new Tools.MoveSegmentTool(ctx))
    eventManager.register("moveSelection", new Tools.MoveSelectionTool(ctx))
    eventManager.setContext(ctx, "select")

    // link transform controls events
    const transform = new Tools.TransformTool(ctx)
    const transformControls = ctx.controllers.transformControls
    transformControls.addEventListener("mouseDown", () =>
        transform.onTransfromStart()
    )
    transformControls.addEventListener("objectChange", () =>
        transform.onTransform()
    )

    //Panel Tool
    const panelTool = new Tools.PanelTool(ctx)

    // set up the scene
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
            panelTool,
        },
        dispose: () => {
            eventManager.dispose()
            disposeApp()
        },
    }
}
