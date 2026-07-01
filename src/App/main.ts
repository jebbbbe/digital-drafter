import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { AspectLayout } from "./utils/AspectLayout"
import { loadGlb } from "./utils/loader"
import { Drafter } from "./draft/Drafter"
import * as rand from "./utils/random"
import { StatsPanel } from "./test/StatsPanel"
import { RaycastHelper } from "./interaction/RaycastHelper"
import { SelectionManager } from "./interaction/selectionManager"
import { TransformControls } from "three/examples/jsm/Addons.js"
import { ThreeControllersManager } from "./interaction/controllers"
import { AppEventManager } from "../AppEventManager/AppEventManager"
import { linkContext } from "./AppContext"
import { settings } from "./settings"

let isAppReady = { value: false }
let renderer!: THREE.WebGLRenderer
let scene!: THREE.Scene
let camera!: THREE.OrthographicCamera
let orbitControls!: OrbitControls
let layout!: AspectLayout
let frameId = 0
let statsPanel: StatsPanel
let drafter!: Drafter
let raycastHelper!: RaycastHelper
let selection!: SelectionManager
let controllers!: ThreeControllersManager
let eventManager!: AppEventManager

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
    eventManager: typeof eventManager
}

export function init(
    container: HTMLElement
    // container: HTMLElement = document.getElementById("app")
): () => void {
    // const assetsLoader = loadAssets()x

    dispose()

    //layout
    layout = new AspectLayout("dynamic", container)

    // renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
    })
    renderer.setSize(layout.x, layout.y)
    renderer.setPixelRatio(globalThis.devicePixelRatio)
    container.appendChild(renderer.domElement)

    statsPanel = new StatsPanel(document.body, import.meta.env.DEV)

    // scene
    scene = new THREE.Scene()
    scene.background = new THREE.Color(settings.display.background)

    //camera
    camera = new THREE.OrthographicCamera(...layout.getThreeOrthographicArgs())
    camera.zoom = settings.camera.zoom
    camera.position.set(...settings.camera.position)
    camera.lookAt(0, 0, 0)

    // Drafter
    drafter = new Drafter(scene)

    // raycaster
    raycastHelper = new RaycastHelper(
        camera,
        drafter.interactiveObjects,
        renderer.domElement
    )
    // selectionManager
    selection = new SelectionManager()

    // controllers
    orbitControls = initOrbit(camera, renderer)
    const transformControls = new TransformControls(camera, renderer.domElement)
    controllers = new ThreeControllersManager(
        selection,
        orbitControls,
        transformControls,
        true
    )
    scene.add(controllers.transformProxy)
    scene.add(transformControls.getHelper())

    // AppEventManager
    eventManager = new AppEventManager()

    // link context with other layers

    //@ts-ignore
    const ctx = {
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
        eventManager,
    } as AppContext

    // passes ctx to controls via intermidate file path, lets use AppContext.ts
    linkContext(ctx)

    // async
    // const [loadedCubeModel] = await assetsLoader
    // if (!loadedCubeModel) {
    //     throw new Error('Failed to resolve asset "/cube.glb"')
    // }
    // scene.add(loadedCubeModel)

    // content
    // const ambient = new THREE.AmbientLight(0xffffff, 0.7)
    // const sun = new THREE.DirectionalLight(0xffffff, 0.9)
    // sun.position.set(2, 3, 4)
    // scene.add(ambient, sun)

    const gridHelper = new THREE.GridHelper()
    const axesHelper = new THREE.AxesHelper(10)
    axesHelper.renderOrder = 1
    // scene.add(gridHelper, axesHelper)

    layout.addResizeListener(renderer, camera, render)
    frameId = globalThis.requestAnimationFrame(animate)
    isAppReady.value = true
    return dispose
}

function render(): void {
    statsPanel.update()
    orbitControls.update()
    renderer.render(scene, camera)
}

function animate(): void {
    render()
    frameId = globalThis.requestAnimationFrame(animate)
}

function dispose(): void {
    isAppReady.value = false

    if (!renderer) {
        return
    }
    globalThis.cancelAnimationFrame(frameId)
    layout.removeResizeListener()
    controllers.dispose()
    statsPanel.dispose()
    renderer.dispose()
    renderer.domElement.remove()
}

function initOrbit(
    camera: THREE.OrthographicCamera,
    renderer: THREE.WebGLRenderer
) {
    orbitControls = new OrbitControls(camera, renderer.domElement)
    orbitControls.enableDamping = true // an animation loop is required when either damping or auto-rotation are enabled
    orbitControls.dampingFactor = 0.15 //0.05
    orbitControls.screenSpacePanning = false
    orbitControls.enablePan = true
    orbitControls.enableRotate = false
    orbitControls.mouseButtons.LEFT = THREE.MOUSE.PAN
    orbitControls.mouseButtons.RIGHT = THREE.MOUSE.PAN
    orbitControls.touches.ONE = THREE.TOUCH.PAN
    orbitControls.touches.TWO = THREE.TOUCH.DOLLY_PAN
    orbitControls.minDistance = 1 //zoom min scaling
    orbitControls.maxDistance = 2000 //zoom max scaling
    orbitControls.minZoom = 0.01
    orbitControls.maxZoom = 10.0
    orbitControls.update()
    // orbitControls.addEventListener("change", () => { // for no aniumation loop()
    // renderer.render(scene, camera);
    // });
    return orbitControls
}

function loadAssets(): Promise<[THREE.Object3D]> {
    return Promise.all([loadGlb("/cube.glb")])
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
}
