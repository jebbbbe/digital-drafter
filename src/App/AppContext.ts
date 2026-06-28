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
