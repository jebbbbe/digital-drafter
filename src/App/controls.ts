import * as THREE from "three"
import { saveAsGlb } from "./Utils/loader"
import { cube } from "./main"

export function randomizeCubeColor(): void {
    const color = new THREE.Color().setHSL(
        Math.random(),
        Math.random(),
        Math.random()
    )
    cube.material.color = color
}
export function toggleCube(): void {
    cube.visible = !cube.visible
}

export function saveCubeAsGlb(): void {
    void saveAsGlb(cube, "cube.glb")
}
