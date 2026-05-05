import * as THREE from "three"
import { downloadBlob, saveAsGlb, saveAsGltf } from "./utils/loader"
import {
    panelPaths,
    setLevaControlDisabled,
} from "../components/Leva/LevaStore"
import type { TransformNode } from "./draft/TransformNode"
import {
    isAppReady,
    camera,
    cube,
    drafter,
    scene,
    orbitControls,
    renderer,
} from "./main"
import * as rand from "./utils/random"
import { getMaxRenderTargetSize } from "./utils/capabilities"

const _matrixPosition = new THREE.Vector3()
const _matrixQuaternion = new THREE.Quaternion()
const _matrixScale = new THREE.Vector3()

function setMatrixUniformScale(matrix: THREE.Matrix4, value: number): void {
    matrix.decompose(_matrixPosition, _matrixQuaternion, _matrixScale)
    _matrixScale.set(value, value, value)
    matrix.compose(_matrixPosition, _matrixQuaternion, _matrixScale)
}

function syncCameraRotationBindings(enableRotate: boolean): void {
    if (!isAppReady) {
        return
    }

    orbitControls.enableRotate = enableRotate
    orbitControls.mouseButtons.LEFT = enableRotate
        ? THREE.MOUSE.ROTATE
        : THREE.MOUSE.PAN
    orbitControls.mouseButtons.RIGHT = THREE.MOUSE.PAN
    orbitControls.touches.ONE = enableRotate
        ? THREE.TOUCH.ROTATE
        : THREE.TOUCH.PAN
    orbitControls.touches.TWO = THREE.TOUCH.DOLLY_PAN
}

export function addTestNode(x: number = 10, z: number = 5): void {
    if (!isAppReady) return
    const instance = drafter.instanceItems[0]
    if(!instance) return
    const max = instance.count - 1
    drafter.addLeafNode(
        {
            position: new THREE.Vector3(
                rand.random(-x, x),
                0,
                rand.random(-z, z)
            ),
        },
        { id: 0, index: rand.randomInt(0, max) },
    )
}

export function setSceneColor(value: string): void {
    if (!isAppReady) return
    ;(scene.background as THREE.Color).set(value)
}

export function setMeshColor(value: string): void {
    if (!isAppReady) return

    drafter.materials.mesh.color.set(value)
}

export function setMeshVisible(value: boolean): void {
    if (!isAppReady) return

    drafter.materials.mesh.visible = value
}

export function setLineColor(value: string): void {
    if (!isAppReady) return

    drafter.materials.line.color.set(value)
}

export function setLineVisible(value: boolean): void {
    if (!isAppReady) return

    drafter.materials.line.visible = value
}

export function setProjectionColor(value: string): void {
    if (!isAppReady) return
    const len = drafter.instanceItems.length
    for (let i = 0; i < len; i++) {
        const instanceItem = drafter.instanceItems[i]
        if (!instanceItem) continue
        instanceItem.instances.proj.material.color.set(value)
    }
}

export function setProjectionVisible(value: boolean): void {
    if (!isAppReady) return
    const len = drafter.instanceItems.length
    for (let i = 0; i < len; i++) {
        const instanceItem = drafter.instanceItems[i]
        if (!instanceItem) continue
        instanceItem.instances.proj.material.visible = value
    }
}

export function resetCamera(): void {
    if (!isAppReady) {
        return
    }

    camera.zoom = 0.075
    camera.position.set(0, 100, 0)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
    orbitControls.target.set(0, 0, 0)
    orbitControls.update()
}

export function toggleCameraRotation(): void {
    const enableRotate = !orbitControls.enableRotate
    syncCameraRotationBindings(enableRotate)

    if (!enableRotate) {
        resetCamera()
    }
}

export function setRootScaleMatrix(value: number): void {
    if (!isAppReady) return

    const instanceItem = drafter.instanceItems[0]
    const rootNode = drafter.tree.findNode({ id: 0, index: 0 }) as
        | TransformNode
        | undefined
    if (!instanceItem || !rootNode) return

    setMatrixUniformScale(instanceItem.localTransform, value)

    rootNode.compoundMatrix.copy(instanceItem.localTransform)
    drafter.updatePatchedNode(rootNode)
}

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
    let glSize = getMaxRenderTargetSize(renderer)
    console.log(glSize)
    // maxRes = glSize
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

export function randomizeMeshColor(): void {
    if (!isAppReady) return

    const color = new THREE.Color().setHSL(
        Math.random(),
        Math.random(),
        Math.random()
    )
    drafter.materials.mesh.color = color
}
