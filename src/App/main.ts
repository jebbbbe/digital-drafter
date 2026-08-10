import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { AspectLayout } from "./utils/AspectLayout"
import { loadGlb } from "./utils/loader"
import { Drafter } from "./draft/Drafter"
import { SectionCutter } from "./interactive/SectionCutter"
import { StatsPanel } from "./test/StatsPanel"
import {
    RaycastHelper,
    SelectionManager,
    ThreeControllersManager,
} from "./selection"
import { TransformControls } from "three/examples/jsm/Addons.js"
import { AppEventManager } from "../AppEventManager/AppEventManager"
import { linkContext } from "./AppContext"
import { settings } from "./settings"
import type { Raycastable } from "@types"

export class ThreeApp {
    isAppReady = { value: false }
    renderer!: THREE.WebGLRenderer
    scene!: THREE.Scene
    camera!: THREE.OrthographicCamera
    orbitControls!: OrbitControls
    layout!: AspectLayout
    statsPanel!: StatsPanel
    drafter!: Drafter
    sectionCutter!: SectionCutter
    raycastObjects!: Raycastable
    raycastHelper!: RaycastHelper
    selection!: SelectionManager
    controllers!: ThreeControllersManager
    eventManager!: AppEventManager
    frameId = 0
    constructor(container: HTMLElement) {
        this.dispose()

        //layout
        const layout = new AspectLayout("dynamic", container)

        // renderer
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance",
        })
        renderer.setSize(layout.x, layout.y)
        renderer.setPixelRatio(globalThis.devicePixelRatio)
        container.appendChild(renderer.domElement)

        const statsPanel = new StatsPanel(document.body, import.meta.env.DEV)

        // scene
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(settings.display.background)

        //camera
        const camera = new THREE.OrthographicCamera(
            ...layout.getThreeOrthographicArgs()
        )
        camera.zoom = settings.camera.zoom
        camera.position.set(...settings.camera.position)
        camera.lookAt(0, 0, 0)

        // interactive geometry
        const raycastObjects: Raycastable = []
        const drafter = new Drafter(scene, raycastObjects)
        const sectionCutter = new SectionCutter(scene, raycastObjects)

        // raycaster
        const raycastHelper = new RaycastHelper(
            camera,
            raycastObjects,
            renderer.domElement
        )
        // selectionManager
        const selection = new SelectionManager()

        // controllers
        const orbitControls = this.initOrbit(camera, renderer)
        const transformControls = new TransformControls(
            camera,
            renderer.domElement
        )
        const controllers = new ThreeControllersManager(
            orbitControls,
            transformControls,
            true
        )
        scene.add(controllers.transformProxy)
        scene.add(transformControls.getHelper())

        // AppEventManager
        const eventManager = new AppEventManager()

        // Misc content

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

        // const gridHelper = new THREE.GridHelper()
        // const axesHelper = new THREE.AxesHelper(10)
        // axesHelper.renderOrder = 1
        // scene.add(gridHelper, axesHelper)

        // params
        this.renderer = renderer
        this.scene = scene
        this.camera = camera
        this.orbitControls = orbitControls
        this.layout = layout
        this.statsPanel = statsPanel
        this.drafter = drafter
        this.sectionCutter = sectionCutter
        this.raycastObjects = raycastObjects
        this.raycastHelper = raycastHelper
        this.selection = selection
        this.controllers = controllers
        this.eventManager = eventManager

        layout.addResizeListener(renderer, camera, () => this.render())
        this.frameId = globalThis.requestAnimationFrame(() => this.animate())
        this.isAppReady.value = true

        //ctx
        linkContext(this)
    }
    dispose() {
        this.isAppReady.value = false

        if (!this.renderer) {
            return
        }
        globalThis.cancelAnimationFrame(this.frameId)
        this.layout.removeResizeListener()
        this.eventManager.dispose()
        this.controllers.dispose()
        this.statsPanel.dispose()
        this.renderer.dispose()
        this.renderer.domElement.remove()
    }

    render(): void {
        this.statsPanel?.update()
        this.orbitControls.update()
        this.renderer.render(this.scene, this.camera)
    }

    animate(): void {
        this.render()
        this.frameId = globalThis.requestAnimationFrame(() => this.animate())
    }

    initOrbit(camera: THREE.OrthographicCamera, renderer: THREE.WebGLRenderer) {
        const orbitControls = new OrbitControls(camera, renderer.domElement)
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
        return orbitControls
    }

    async loadAssets(): Promise<[THREE.Object3D]> {
        return Promise.all([loadGlb("/cube.glb")])
    }
}
