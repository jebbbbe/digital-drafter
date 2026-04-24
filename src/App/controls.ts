import * as THREE from "three"
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
