// context.ts
import type { ThreeApp } from "./main"

export type AppContext = Pick<
    ThreeApp,
    | "isAppReady"
    | "renderer"
    | "scene"
    | "camera"
    | "orbitControls"
    | "drafter"
    | "raycastHelper"
    | "selection"
    | "controllers"
    | "statsPanel"
    | "eventManager"
>

export let isAppReady: AppContext["isAppReady"]
export let renderer: AppContext["renderer"]
export let scene: AppContext["scene"]
export let camera: AppContext["camera"]
export let orbitControls: AppContext["orbitControls"]
export let drafter: AppContext["drafter"]
export let raycastHelper: AppContext["raycastHelper"]
export let selection: AppContext["selection"]
export let controllers: AppContext["controllers"]
export let statsPanel: AppContext["statsPanel"]
export let eventManager: AppContext["eventManager"]

export function linkContext(ctx: AppContext) {
    isAppReady = ctx.isAppReady
    renderer = ctx.renderer
    scene = ctx.scene
    camera = ctx.camera
    orbitControls = ctx.orbitControls
    drafter = ctx.drafter
    raycastHelper = ctx.raycastHelper
    selection = ctx.selection
    controllers = ctx.controllers
    statsPanel = ctx.statsPanel
    eventManager = ctx.eventManager
}
