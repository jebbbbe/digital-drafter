import * as THREE from "three"
import { makeCustomShape } from "./Geometry/geometry"
import { OrbitControls } from "three/examples/jsm/Addons.js"

const cube = new THREE.Mesh(
    makeCustomShape(),
    new THREE.MeshStandardMaterial({
        color: "#1d8bff",
        roughness: 0.35,
        metalness: 0.08,
    })
)

let containerElement!: HTMLElement
let renderer!: THREE.WebGLRenderer
let scene!: THREE.Scene
let camera!: THREE.PerspectiveCamera
let controls!: OrbitControls
let resizeObserver: ResizeObserver | null = null
let frameId = 0

function resize(): void {
    if (!resizeObserver) {
        return
    }

    const width = containerElement.clientWidth
    const height = containerElement.clientHeight

    if (!width || !height) {
        return
    }

    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, false)
}

function render(): void {
    cube.rotation.x += 0.009
    cube.rotation.y += 0.012
    controls.update()
    renderer.render(scene, camera)
}

function animate(): void {
    render()
    frameId = globalThis.requestAnimationFrame(animate)
}

function dispose(): void {
    if (!resizeObserver) {
        return
    }

    globalThis.cancelAnimationFrame(frameId)
    resizeObserver.disconnect()
    resizeObserver = null
    renderer.dispose()
    renderer.domElement.remove()
}

export function init(container: HTMLElement): () => void {
    dispose()

    containerElement = container

    // renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
    })
    renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio, 1.5))
    container.appendChild(renderer.domElement)

    // scene
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xeef4ff)

    //camera
    camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
    // camera = new THREE.OrthographicCamera(60, 1, 0.1, 100)
    camera.position.set(3.7, 3.7 * 0.65, 3.7)
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

    scene.add(cube, ambient, sun, gridHelper, axesHelper)

    resizeObserver = new ResizeObserver(resize)

    resize()

    resizeObserver.observe(container)

    frameId = globalThis.requestAnimationFrame(animate)

    return dispose
}

export { renderer, scene, camera, controls, cube }

function initOrbit(camera, renderer) {
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.15 //0.05
    controls.screenSpacePanning = false
    controls.enablePan = false
    controls.panning = false
    controls.minDistance = 1 //zoom min scaling
    controls.maxDistance = 2000 //zoom max scaling
    // camera.position.set(90, 90, 90)
    // camera.zoom = 0.06
    controls.update()
    // controls.addEventListener("change", () => { // for no aniumation loop()
    // renderer.render(scene, camera);
    // });
    return controls
}
