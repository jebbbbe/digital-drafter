import * as THREE from "three"
import * as shape from "./objects/geometries/geometry"
import { OrbitControls } from "three/examples/jsm/Addons.js"
import { AspectLayout } from "./utils/AspectLayout"
import { loadGlb } from "./utils/loader"
import { RaycastHelper } from "./interaction/RaycastHelper"
import { Drafter } from "./draft/Drafter"

const cube = new THREE.Mesh(
    // shape.makeCustomMergeShape(),
    shape.makeCustomBVHShape(),
    // shape.makeCustomBVHHierarchyShape(),
    new THREE.MeshStandardMaterial({
        color: "#1d8bff",
        roughness: 0.35,
        metalness: 0.08,
    })
)
let renderer!: THREE.WebGLRenderer
let scene!: THREE.Scene
let camera!: THREE.OrthographicCamera
let controls!: OrbitControls
let layout!: AspectLayout
let frameId = 0

let raycastHelper!: RaycastHelper
let drafter!: Drafter

export function init(container: HTMLElement): () => void {
    // const assetsLoader = loadAssets()

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

    // scene
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xeef4ff)

    //camera
    camera = new THREE.OrthographicCamera(...layout.getThreeOrthographicArgs())
    camera.zoom = 0.075
    camera.position.set(0, 100, 0)
    camera.lookAt(0, 0, 0)

    //controls
    controls = initOrbit(camera, renderer)
    console.log({ controls })

    // content
    const ambient = new THREE.AmbientLight(0xffffff, 0.7)
    const sun = new THREE.DirectionalLight(0xffffff, 0.9)
    sun.position.set(2, 3, 4)
    const gridHelper = new THREE.GridHelper()
    const axesHelper = new THREE.AxesHelper(10)
    axesHelper.renderOrder = 1

    // scene.add(ambient, sun, gridHelper, axesHelper)
    scene.add(ambient, sun)

    // Drafter
    drafter = new Drafter(scene, cube.geometry, [
        { pos: new THREE.Vector3(0, 0, 0) },
        { pos: new THREE.Vector3(5, 0, 0), parent: 0 },
        { pos: new THREE.Vector3(5, 0, 5), parent: 1 },
        { pos: new THREE.Vector3(5, 0, -5), parent: 2 },
        { pos: new THREE.Vector3(-5, 0, -5), parent: 0 },
        { pos: new THREE.Vector3(-5, 0, 5), parent: 0 },
        { pos: new THREE.Vector3(10, 0, 0), parent: 0 },
        { pos: new THREE.Vector3(-10, 0, 0), parent: 0 },
    ])
    ;(globalThis as any).drafter = drafter
    console.log(drafter)

    // const [loadedCubeModel] = await assetsLoader
    // if (!loadedCubeModel) {
    //     throw new Error('Failed to resolve asset "/cube.glb"')
    // }
    // scene.add(loadedCubeModel)

    raycastHelper = new RaycastHelper(camera, scene, renderer.domElement)

    layout.addResizeListener(renderer, camera, render)

    frameId = globalThis.requestAnimationFrame(animate)

    globalThis.addEventListener("pointerdown", (e) => {
        let intersects = raycastHelper.castFromEvent(e)
        if (intersects.length === 0) {
            // no intersects
            return
        }
        const int = intersects[0]
        if (!int.face) {
            // not a mesh
            return
        }
        const id = int.object.userData.id
        const index = int.instanceId

        console.log(id, index, int)
    })

    return dispose
}

function render(): void {
    controls.update()
    renderer.render(scene, camera)
}

function animate(): void {
    render()
    frameId = globalThis.requestAnimationFrame(animate)
}

function dispose(): void {
    if (!renderer) {
        return
    }
    globalThis.cancelAnimationFrame(frameId)
    layout.removeResizeListener()
    renderer.dispose()
    renderer.domElement.remove()
}

function initOrbit(
    camera: THREE.OrthographicCamera,
    renderer: THREE.WebGLRenderer
) {
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.15 //0.05
    controls.screenSpacePanning = false
    controls.enablePan = false
    controls.minDistance = 1 //zoom min scaling
    controls.maxDistance = 2000 //zoom max scaling
    controls.update()
    // controls.addEventListener("change", () => { // for no aniumation loop()
    // renderer.render(scene, camera);
    // });
    return controls
}

export { renderer, scene, camera, controls, cube }

function loadAssets(): Promise<[THREE.Object3D]> {
    return Promise.all([loadGlb("/cube.glb")])
}
