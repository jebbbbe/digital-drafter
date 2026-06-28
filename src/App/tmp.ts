import * as ctx from "./AppContext"
import { AppEventManager } from "./AppEventManager/AppEventManager"
import * as Tools from "./ToolRegistry/index"

const registry = new Tools.ToolRegistry()
registry.register("move", new Tools.MoveTool(ctx))
registry.register("select", new Tools.SelectTool(ctx))
const events = new AppEventManager(ctx, registry, "select")

export { events }
