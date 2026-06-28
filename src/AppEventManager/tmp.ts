import * as ctx from "../App/AppContext"
import { AppEventManager } from "./AppEventManager"
import * as Tools from "./ToolRegistry/index"

const registry = new Tools.ToolRegistry()
registry.register("move", new Tools.MoveTool(ctx))
registry.register("select", new Tools.SelectTool(ctx))

console.log(registry)
const events = new AppEventManager(ctx, registry, "select")

export { events }

