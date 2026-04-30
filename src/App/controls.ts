import * as THREE from "three"
import { saveAsGlb, saveAsGltf } from "./utils/loader"
import { camera, cube, drafter } from "./main"
import * as rand from "./utils/random"

export function randomizeMeshColor(): void {
    const color = new THREE.Color().setHSL(
        Math.random(),
        Math.random(),
        Math.random()
    )
    drafter.materials.mesh.color = color
}

export function toggleMesh(): void {
    drafter.materials.mesh.visible = !drafter.materials.mesh.visible
}

export function toggleLine(): void {
    drafter.materials.line.visible = !drafter.materials.line.visible
}

export function saveCubeAsGlb(): void {
    void saveAsGlb(cube, "cube.glb")
}

export function saveCubeAsGltf(): void {
    void saveAsGltf(cube, "cube.gltf")
}

export function addNodeTest(): void {
    drafter.addNode(
        0,
        0,
        new THREE.Vector3(rand.random(-10, 10), 0, rand.random(-5, 5))
    )
}

export function resetCamera(): void {
    camera.zoom = 0.075
    camera.position.set(0, 100, 0)
    camera.lookAt(0, 0, 0)
}
