import * as THREE from "three"
import { makeCustomShape } from "./Geometry/geometry"

const CAMERA_DISTANCE = 2.7
export const cube = new THREE.Mesh(
    makeCustomShape(),
    new THREE.MeshStandardMaterial({
        color: "#1d8bff",
        roughness: 0.35,
        metalness: 0.08,
    })
)

export function init(container: HTMLElement): () => void {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color("#eef4ff")

    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
    camera.position.set(
        CAMERA_DISTANCE,
        CAMERA_DISTANCE * 0.65,
        CAMERA_DISTANCE
    )
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: "high-performance",
    })

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    container.appendChild(renderer.domElement)

    scene.add(cube)

    const ambient = new THREE.AmbientLight(0xffffff, 0.7)
    const sun = new THREE.DirectionalLight(0xffffff, 0.9)
    sun.position.set(2, 3, 4)
    scene.add(ambient, sun)

    const resize = () => {
        const width = container.clientWidth
        const height = container.clientHeight

        if (!width || !height) {
            return
        }

        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize(width, height, false)
    }

    resize()

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)

    let frameId = 0

    const animate = () => {
        cube.rotation.x += 0.009
        cube.rotation.y += 0.012
        renderer.render(scene, camera)
        frameId = window.requestAnimationFrame(animate)
    }

    frameId = window.requestAnimationFrame(animate)

    return () => {
        window.cancelAnimationFrame(frameId)
        resizeObserver.disconnect()
        cube.geometry.dispose()
        cube.material.dispose()
        renderer.dispose()
        renderer.domElement.remove()
    }
}

export function updateCubeColor(color: THREE.Color): void {
    cube.material.color = color
}
