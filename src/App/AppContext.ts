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
    interactionManager,
    statsPanel,
} from "./main"
