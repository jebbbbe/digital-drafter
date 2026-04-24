import { Color } from "three"
import { updateCubeColor } from "./main"

export function randomizeCubeColor(): void {
    const color = new Color().setHSL(
        Math.random(),
        Math.random(),
        Math.random()
    )

    updateCubeColor(color)
}
