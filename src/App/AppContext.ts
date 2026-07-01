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
    statsPanel: typeof statsPanel
}
