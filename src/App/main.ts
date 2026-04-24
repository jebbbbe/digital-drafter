import * as THREE from "three"
import { makeCustomShape } from "./Geometry/geometry"

export const cube = new THREE.Mesh(
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
    renderer.render(scene, camera)
}

function animate(): void {
    render()
    frameId = window.requestAnimationFrame(animate)
}

function dispose(): void {
    if (!resizeObserver) {
        return
    }

    window.cancelAnimationFrame(frameId)
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
        antialias: false,
        powerPreference: "high-performance",
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    container.appendChild(renderer.domElement)

    // scene
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xeef4ff)

    //camera
    camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
    camera.position.set(3.7, 3.7 * 0.65, 3.7)
    camera.lookAt(0, 0, 0)

    // content
    scene.add(cube)
    const ambient = new THREE.AmbientLight(0xffffff, 0.7)
    const sun = new THREE.DirectionalLight(0xffffff, 0.9)
    sun.position.set(2, 3, 4)
    scene.add(ambient, sun)

    resizeObserver = new ResizeObserver(resize)

    resize()

    resizeObserver.observe(container)

    frameId = window.requestAnimationFrame(animate)

    return dispose
}
