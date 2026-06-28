if (import.meta.env.DEV) {
    console.log("DEV")
}

export {
    isAppReady,
    renderer,
    scene,
    camera,
    orbitControls,
    drafter,
    raycastHelper,
    selection,
    controllers,
    interactionManager,
    statsPanel,
} from "./main"

import {
    isAppReady,
    renderer,
    scene,
    camera,
    orbitControls,
    drafter,
    raycastHelper,
    selection,
    controllers,
    interactionManager,
    statsPanel,
} from "./main"

export type AppContext = {
    isAppReady: typeof isAppReady
    renderer: typeof renderer
    scene: typeof scene
    camera: typeof camera
    orbitControls: typeof orbitControls
    drafter: typeof drafter
    raycastHelper: typeof raycastHelper
    selection: typeof selection
    controllers: typeof controllers
    interactionManager: typeof interactionManager
    statsPanel: typeof statsPanel
}
