import * as THREE from "three"
import { getMaxRenderTargetSize } from "../utils/capabilities"
import { downloadBlob, saveAsGlb, saveAsGltf } from "../utils/loader"
import { isAppReady, camera, orbitControls, renderer, scene} from "../main"
import { cube } from "../main"

export function saveCubeAsGlb(): void {
    void saveAsGlb(cube, "cube.glb")
}

export function saveCubeAsGltf(): void {
    void saveAsGltf(cube, "cube.gltf")
}

export function downloadImage(
    filename = "drawing.png",
    maxRes = 4096 * 2
): void {
    if (!isAppReady) return

    const viewportSize = renderer.getSize(new THREE.Vector2())
    const aspect = viewportSize.x / viewportSize.y
    const glSize = getMaxRenderTargetSize(renderer)
    console.log({ glSize })
    const exportWidth = aspect >= 1 ? maxRes : Math.round(maxRes * aspect)
    const exportHeight = aspect >= 1 ? Math.round(maxRes / aspect) : maxRes

    const renderTarget = new THREE.WebGLRenderTarget(exportWidth, exportHeight)
    const previousRenderTarget = renderer.getRenderTarget()
    const pixels = new Uint8Array(exportWidth * exportHeight * 4)

    orbitControls.update()
    renderer.setRenderTarget(renderTarget)
    renderer.render(scene, camera)
    renderer.readRenderTargetPixels(
        renderTarget,
        0,
        0,
        exportWidth,
        exportHeight,
        pixels
    )
    renderer.setRenderTarget(previousRenderTarget)

    const canvas = document.createElement("canvas")
    canvas.width = exportWidth
    canvas.height = exportHeight

    const context = canvas.getContext("2d")
    if (!context) {
        renderTarget.dispose()
        return
    }

    const imageData = context.createImageData(exportWidth, exportHeight)
    const rowStride = exportWidth * 4

    for (let y = 0; y < exportHeight; y++) {
        const sourceOffset = (exportHeight - y - 1) * rowStride
        const targetOffset = y * rowStride
        imageData.data.set(
            pixels.subarray(sourceOffset, sourceOffset + rowStride),
            targetOffset
        )
    }

    context.putImageData(imageData, 0, 0)
    renderTarget.dispose()

    canvas.toBlob((blob) => {
        if (!blob) {
            return
        }

        downloadBlob(blob, filename)
    }, "image/png")
}
