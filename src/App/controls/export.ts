import * as THREE from "three"
import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter.js"
import { FoldLineMaterial } from "../objects/materials/FoldLineMaterial"
import { FoldLineMaterial2 } from "../objects/materials/FoldLineMaterial2"
import { ProjectionLineMaterial } from "../objects/materials/ProjectionLineMaterial"
import { ProjectionLineMaterial2 } from "../objects/materials/ProjectionLineMaterial2"
import { SVGRenderer } from "three/examples/jsm/renderers/SVGRenderer.js"
import { InstanceCount } from "../constants"
import { orders } from "../draft/materialManager"
import { getMaxRenderTargetSize } from "../utils/capabilities"
import { downloadBlob, saveAsGlb, saveAsGltf } from "../utils/loader"
import {
    camera,
    drafter,
    interactionManager,
    orbitControls,
    renderer,
    scene,
} from "../AppContext"

const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({
        color: "#1d8bff",
        roughness: 0.35,
        metalness: 0.08,
    })
)

const exportSize = new THREE.Vector2()
const instanceMatrix = new THREE.Matrix4()
const worldMatrix = new THREE.Matrix4()
const instanceColor = new THREE.Color()
const treeDataMetadata = new THREE.Vector4()
const parentMatrix = new THREE.Matrix4()
const parentMetadata = new THREE.Vector4()
const childPoint = new THREE.Vector3()
const parentPoint = new THREE.Vector3()
const childPos2 = new THREE.Vector2()
const parentPos2 = new THREE.Vector2()
const foldDir = new THREE.Vector2()
const foldNorm = new THREE.Vector2()

export function saveCubeAsGlb(): void {
    void saveAsGlb(cube, "cube.glb")
}

export function saveCubeAsGltf(): void {
    void saveAsGltf(cube, "cube.gltf")
}

function downloadExport(
    filename: string,
    source: Blob | BlobPart[] | null,
    type?: string
): void {
    if (!source) {
        return
    }

    const blob =
        source instanceof Blob ? source : new Blob(source, type ? { type } : {})

    downloadBlob(blob, filename)
}

export function downloadSvg(
    sourceScene: THREE.Scene = scene,
    filename = "drawing.svg"
): void {
    const viewportSize = renderer.getSize(exportSize)
    const svgRenderer = new SVGRenderer()

    orbitControls.update()
    sourceScene.updateMatrixWorld(true)
    camera.updateMatrixWorld(true)
    camera.updateProjectionMatrix()

    const exportScene = createSvgExportScene(sourceScene)

    svgRenderer.setSize(viewportSize.x, viewportSize.y)
    svgRenderer.render(exportScene, camera)

    const svgElement = svgRenderer.domElement
    svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    svgElement.setAttribute("version", "1.1")

    if (sourceScene.background instanceof THREE.Color) {
        svgElement.style.backgroundColor = `#${sourceScene.background.getHexString()}`
    }

    const serializedSvg = new XMLSerializer().serializeToString(svgElement)
    downloadExport(filename, [serializedSvg], "image/svg+xml;charset=utf-8")

    disposeSvgExportScene(exportScene)
}

export function downloadSceneAsObj(
    sourceScene: THREE.Scene = scene,
    filename = "scene.obj"
): void {
    const exporter = new OBJExporter()

    orbitControls.update()
    sourceScene.updateMatrixWorld(true)

    const exportScene = createObjExportScene(sourceScene)
    const obj = exporter.parse(exportScene)

    downloadExport(filename, [obj], "text/plain;charset=utf-8")

    disposeObjExportScene(exportScene)
}

export function downloadSelectedObjectAsObj(filename = "object.obj"): void {
    const node = interactionManager.selection.firstNode()
    if (!node || node.location.index < 0) {
        return
    }

    const exporter = new OBJExporter()

    orbitControls.update()
    scene.updateMatrixWorld(true)

    const exportScene = createSelectedObjectObjScene(node.location)
    const obj = exporter.parse(exportScene)

    downloadExport(filename, [obj], "text/plain;charset=utf-8")

    disposeObjExportScene(exportScene)
}

type InstancedRenderable = THREE.Object3D & {
    isInstancedMesh: true
    count: number
    geometry: THREE.BufferGeometry
    material: THREE.Material | THREE.Material[]
    getMatrixAt(index: number, matrix: THREE.Matrix4): void
    getColorAt?(index: number, color: THREE.Color): void
    instanceColor?: THREE.InstancedBufferAttribute | null
}

function createSvgExportScene(sourceScene: THREE.Scene): THREE.Scene {
    const exportScene = new THREE.Scene()

    sourceScene.traverseVisible((object) => {
        if (object === sourceScene) {
            return
        }

        if (isInstancedRenderable(object)) {
            addInstancedSvgObjects(exportScene, object)
            return
        }

        const svgObject = createSvgObject(object)
        if (svgObject) {
            exportScene.add(svgObject)
        }
    })

    return exportScene
}

function createObjExportScene(sourceScene: THREE.Scene): THREE.Scene {
    const exportScene = new THREE.Scene()

    sourceScene.traverseVisible((object) => {
        if (object === sourceScene) {
            return
        }

        if (isInstancedRenderable(object)) {
            addInstancedObjObjects(exportScene, object)
            return
        }

        if (!shouldExportPlainObjObject(object)) {
            return
        }

        const geometry = getObjGeometry(object)
        if (!geometry) {
            return
        }

        const objObject = instantiateSvgObject(
            object,
            geometry,
            getObjectMaterial(object)
        )
        if (!objObject) {
            if (geometry.userData.exportDisposable) {
                geometry.dispose()
            }
            return
        }

        if (isGroundedObjLine(objObject)) {
            const groundedGeometry = createGroundedWorldLineGeometry(
                geometry,
                object.matrixWorld
            )

            if (geometry.userData.exportDisposable) {
                geometry.dispose()
            }

            ;(objObject as THREE.Line).geometry = groundedGeometry
            objObject.matrixAutoUpdate = false
            objObject.matrix.identity()
            objObject.matrixWorld.identity()
        } else {
            objObject.matrixAutoUpdate = false
            objObject.matrix.copy(object.matrixWorld)
            objObject.matrixWorld.copy(object.matrixWorld)
        }

        objObject.renderOrder = object.renderOrder
        exportScene.add(objObject)
    })

    return exportScene
}

function createSelectedObjectObjScene(location: {
    id: number
    index: number
}): THREE.Scene {
    const exportScene = new THREE.Scene()
    const instanceItem = drafter.getInstance(location.id)

    addInstancedObjObject(
        exportScene,
        instanceItem.instances.mesh,
        location.index
    )

    return exportScene
}

function addInstancedObjObjects(
    exportScene: THREE.Scene,
    source: InstancedRenderable
): void {
    if (!shouldExportInstancedObjObject(source)) {
        return
    }

    for (let index = 0; index < source.count; index++) {
        addInstancedObjObject(exportScene, source, index)
    }
}

function addInstancedObjObject(
    exportScene: THREE.Scene,
    source: InstancedRenderable,
    index: number
): void {
    const geometry = getInstancedObjGeometry(source, index)
    if (!geometry) {
        return
    }

    const objObject = instantiateSvgObject(
        source,
        geometry,
        getObjectMaterial(source)
    )
    if (!objObject) {
        if (geometry.userData.exportDisposable) {
            geometry.dispose()
        }
        return
    }

    if (usesBakedTreeGeometry(source.material)) {
        worldMatrix.copy(source.matrixWorld)
    } else {
        readInstanceTransformMatrix(source, index, instanceMatrix)
        worldMatrix.multiplyMatrices(source.matrixWorld, instanceMatrix)
    }

    if (isGroundedObjLine(objObject)) {
        const groundedGeometry = createGroundedWorldLineGeometry(
            geometry,
            worldMatrix
        )

        if (geometry.userData.exportDisposable) {
            geometry.dispose()
        }

        ;(objObject as THREE.Line).geometry = groundedGeometry
        objObject.matrixAutoUpdate = false
        objObject.matrix.identity()
        objObject.matrixWorld.identity()
    } else {
        objObject.matrixAutoUpdate = false
        objObject.matrix.copy(worldMatrix)
        objObject.matrixWorld.copy(worldMatrix)
    }

    objObject.renderOrder = source.renderOrder
    exportScene.add(objObject)
}

function addInstancedSvgObjects(
    exportScene: THREE.Scene,
    source: InstancedRenderable
): void {
    for (let index = 0; index < source.count; index++) {
        const geometry = getInstancedSvgGeometry(source, index)
        if (!geometry) {
            continue
        }

        const material = createSvgMaterial(
            source,
            source.material,
            getInstanceColor(source, index)
        )
        if (!material) {
            continue
        }

        if (usesBakedTreeGeometry(source.material)) {
            worldMatrix.copy(source.matrixWorld)
        } else {
            readInstanceTransformMatrix(source, index, instanceMatrix)
            worldMatrix.multiplyMatrices(source.matrixWorld, instanceMatrix)
        }

        const svgObject = instantiateSvgObject(source, geometry, material)
        if (!svgObject) {
            disposeSvgMaterial(material)
            if (geometry.userData.exportDisposable) {
                geometry.dispose()
            }
            continue
        }

        svgObject.matrixAutoUpdate = false
        svgObject.matrix.copy(worldMatrix)
        svgObject.matrixWorld.copy(worldMatrix)
        svgObject.renderOrder = source.renderOrder
        exportScene.add(svgObject)
    }
}

type TreeDataMaterial = THREE.Material & {
    treeData?: THREE.DataTexture | null
    foldDistance?: number
    foldSize?: number
}

function readInstanceTransformMatrix(
    source: InstancedRenderable,
    index: number,
    target: THREE.Matrix4
): void {
    if (readTreeDataSlot(source, index, target, treeDataMetadata)) {
        return
    }

    source.getMatrixAt(index, target)
}

function readTreeDataSlot(
    source: InstancedRenderable,
    index: number,
    target: THREE.Matrix4,
    metadataTarget: THREE.Vector4
): boolean {
    const slot = getTreeDataSlot(source, index)
    if (slot === undefined) {
        return false
    }

    return readTreeDataSlotAtSlot(source.material, slot, target, metadataTarget)
}

function getTreeDataSlot(
    source: InstancedRenderable,
    index: number
): number | undefined {
    const blockId = source.userData?.id
    if (typeof blockId !== "number") {
        return undefined
    }

    return blockId * InstanceCount + index
}

function getInstancedSvgGeometry(
    source: InstancedRenderable,
    index: number
): THREE.BufferGeometry | undefined {
    if (hasProjectionMaterial(source.material)) {
        return createProjectionGeometry(source, index, false)
    }

    if (hasFoldMaterial(source.material)) {
        return createFoldGeometry(source, index, 10)
    }

    return getSvgGeometry(source)
}

function getInstancedObjGeometry(
    source: InstancedRenderable,
    index: number
): THREE.BufferGeometry | undefined {
    if (hasProjectionMaterial(source.material)) {
        return createProjectionGeometry(source, index, true)
    }

    if (hasFoldMaterial(source.material)) {
        return createFoldGeometry(source, index, 0)
    }

    return getObjGeometry(source)
}

function createProjectionGeometry(
    source: InstancedRenderable,
    index: number,
    flattenY: boolean
): THREE.BufferGeometry | undefined {
    const position = source.geometry.getAttribute("position")
    if (!position) {
        return
    }

    if (!readTreeDataSlot(source, index, instanceMatrix, treeDataMetadata)) {
        return
    }

    const parentSlot = Math.round(treeDataMetadata.x)
    if (
        !readTreeDataSlotAtSlot(
            source.material,
            parentSlot,
            parentMatrix,
            parentMetadata
        )
    ) {
        return
    }

    const positions = new Float32Array(position.count * 3)

    for (let vertexIndex = 0; vertexIndex < position.count; vertexIndex += 2) {
        const x = position.getX(vertexIndex)
        const y = position.getY(vertexIndex)
        const z = position.getZ(vertexIndex)

        childPoint.set(x, y, z).applyMatrix4(instanceMatrix)
        parentPoint.set(x, y, z).applyMatrix4(parentMatrix)

        if (flattenY) {
            childPoint.y = 0
            parentPoint.y = 0
        } else if (childPoint.y <= 0 || parentPoint.y <= 0) {
            childPoint.y = -5
            parentPoint.y = -5
        }

        childPoint.toArray(positions, vertexIndex * 3)
        parentPoint.toArray(positions, (vertexIndex + 1) * 3)
    }

    return createLineSegmentsGeometryFromPositions(positions)
}

function createFoldGeometry(
    source: InstancedRenderable,
    index: number,
    y: number
): THREE.BufferGeometry | undefined {
    if (!readTreeDataSlot(source, index, instanceMatrix, treeDataMetadata)) {
        return
    }

    const parentSlot = Math.round(treeDataMetadata.x)
    if (
        !readTreeDataSlotAtSlot(
            source.material,
            parentSlot,
            parentMatrix,
            parentMetadata
        )
    ) {
        return
    }

    childPos2.set(instanceMatrix.elements[12], instanceMatrix.elements[14])
    parentPos2.set(parentMatrix.elements[12], parentMatrix.elements[14])
    foldDir.subVectors(parentPos2, childPos2)

    const nodeDistance = foldDir.length()
    if (nodeDistance === 0) {
        return
    }

    foldDir.divideScalar(nodeDistance)
    foldNorm.set(-foldDir.y, foldDir.x)

    const material = getFirstMaterial(source.material)
    const foldDistance =
        (material as TreeDataMaterial | undefined)?.foldDistance ?? 1.1
    const foldSize = (material as TreeDataMaterial | undefined)?.foldSize ?? 1.1
    const adjustedFoldDistance = Math.min(foldDistance, nodeDistance / 2)

    foldDir.multiplyScalar(adjustedFoldDistance)
    foldNorm.multiplyScalar(foldSize / 2)

    const positions = new Float32Array(12)
    positions[0] = childPos2.x + foldDir.x + foldNorm.x
    positions[1] = y
    positions[2] = childPos2.y + foldDir.y + foldNorm.y
    positions[3] = childPos2.x + foldDir.x - foldNorm.x
    positions[4] = y
    positions[5] = childPos2.y + foldDir.y - foldNorm.y
    positions[6] = parentPos2.x - foldDir.x + foldNorm.x
    positions[7] = y
    positions[8] = parentPos2.y - foldDir.y + foldNorm.y
    positions[9] = parentPos2.x - foldDir.x - foldNorm.x
    positions[10] = y
    positions[11] = parentPos2.y - foldDir.y - foldNorm.y

    return createLineSegmentsGeometryFromPositions(positions)
}

function readTreeDataSlotAtSlot(
    material: THREE.Material | THREE.Material[],
    slot: number,
    target: THREE.Matrix4,
    metadataTarget: THREE.Vector4
): boolean {
    const treeData = getTreeDataTexture(material)
    const array = treeData?.source.data.data
    if (!(array instanceof Float32Array)) {
        return false
    }

    const offset = slot * 20
    if (offset + 19 >= array.length) {
        return false
    }

    target.fromArray(array, offset)
    metadataTarget.fromArray(array, offset + 16)
    return true
}

function hasProjectionMaterial(
    material: THREE.Material | THREE.Material[]
): boolean {
    const isProjectionMaterial = (mat: THREE.Material): boolean =>
        mat instanceof ProjectionLineMaterial ||
        mat instanceof ProjectionLineMaterial2

    if (Array.isArray(material)) {
        return material.some(isProjectionMaterial)
    }

    return isProjectionMaterial(material)
}

function hasFoldMaterial(material: THREE.Material | THREE.Material[]): boolean {
    const isFoldMaterial = (mat: THREE.Material): boolean =>
        mat instanceof FoldLineMaterial || mat instanceof FoldLineMaterial2

    if (Array.isArray(material)) {
        return material.some(isFoldMaterial)
    }

    return isFoldMaterial(material)
}

function usesBakedTreeGeometry(
    material: THREE.Material | THREE.Material[]
): boolean {
    return hasProjectionMaterial(material) || hasFoldMaterial(material)
}

function getFirstMaterial(
    material: THREE.Material | THREE.Material[]
): THREE.Material | undefined {
    return Array.isArray(material) ? material[0] : material
}

function getTreeDataTexture(
    material: THREE.Material | THREE.Material[]
): THREE.DataTexture | null {
    if (Array.isArray(material)) {
        for (let index = 0; index < material.length; index++) {
            const texture = getTreeDataTexture(material[index])
            if (texture) {
                return texture
            }
        }

        return null
    }

    return (material as TreeDataMaterial).treeData ?? null
}

function createSvgObject(source: THREE.Object3D): THREE.Object3D | undefined {
    const geometry = getSvgGeometry(source)
    if (!geometry) {
        return
    }

    const material = createSvgMaterial(source, (source as any).material)
    if (!material) {
        return
    }

    const svgObject = instantiateSvgObject(source, geometry, material)
    if (!svgObject) {
        disposeSvgMaterial(material)
        return
    }

    svgObject.matrixAutoUpdate = false
    svgObject.matrix.copy(source.matrixWorld)
    svgObject.matrixWorld.copy(source.matrixWorld)
    svgObject.renderOrder = source.renderOrder

    return svgObject
}

function instantiateSvgObject(
    source: THREE.Object3D,
    geometry: THREE.BufferGeometry,
    material: THREE.Material | THREE.Material[]
): THREE.Object3D | undefined {
    if (
        source instanceof THREE.Line &&
        !(source instanceof THREE.LineSegments)
    ) {
        return new THREE.Line(geometry, material)
    }

    if (shouldRenderAsLine(source, geometry)) {
        return new THREE.LineSegments(geometry, material)
    }

    if (source instanceof THREE.Mesh) {
        return new THREE.Mesh(geometry, material)
    }

    if (source instanceof THREE.LineSegments) {
        return new THREE.LineSegments(geometry, material)
    }
}

function shouldRenderAsLine(
    source: THREE.Object3D,
    geometry: THREE.BufferGeometry
): boolean {
    return (
        source instanceof THREE.Line ||
        source instanceof THREE.LineSegments ||
        isFatLineGeometry(geometry)
    )
}

function getSvgGeometry(
    source: THREE.Object3D | InstancedRenderable
): THREE.BufferGeometry | undefined {
    const geometry = (source as any).geometry as
        | THREE.BufferGeometry
        | undefined
    if (!geometry) {
        return
    }

    if (isFatLineGeometry(geometry)) {
        return createLineSegmentsGeometryFromFatLine(geometry)
    }

    return geometry
}

function getObjGeometry(
    source: THREE.Object3D | InstancedRenderable
): THREE.BufferGeometry | undefined {
    const geometry = (source as any).geometry as
        | THREE.BufferGeometry
        | undefined
    if (!geometry) {
        return
    }

    return geometry
}

function createLineSegmentsGeometryFromPositions(
    positions: THREE.TypedArray
): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geometry.userData.exportDisposable = true
    return geometry
}

function createGroundedWorldLineGeometry(
    geometry: THREE.BufferGeometry,
    matrix: THREE.Matrix4
): THREE.BufferGeometry {
    const position = geometry.getAttribute("position")
    const positions = new Float32Array(position.count * 3)

    for (let index = 0; index < position.count; index++) {
        childPoint.fromBufferAttribute(position, index).applyMatrix4(matrix)
        childPoint.y = 0
        childPoint.toArray(positions, index * 3)
    }

    return createLineSegmentsGeometryFromPositions(positions)
}

function createLineSegmentsGeometryFromFatLine(
    geometry: THREE.BufferGeometry
): THREE.BufferGeometry | undefined {
    const start = geometry.getAttribute("instanceStart")
    const end = geometry.getAttribute("instanceEnd")
    if (!start || !end) {
        return
    }

    const positions = new Float32Array(start.count * 6)

    for (let index = 0; index < start.count; index++) {
        const offset = index * 6
        positions[offset + 0] = start.getX(index)
        positions[offset + 1] = start.getY(index)
        positions[offset + 2] = start.getZ(index)
        positions[offset + 3] = end.getX(index)
        positions[offset + 4] = end.getY(index)
        positions[offset + 5] = end.getZ(index)
    }

    return createLineSegmentsGeometryFromPositions(positions)
}

function createSvgMaterial(
    source: THREE.Object3D,
    material: THREE.Material | THREE.Material[] | undefined,
    colorOverride?: THREE.Color
): THREE.Material | THREE.Material[] | undefined {
    if (!material) {
        return
    }

    if (Array.isArray(material)) {
        const materials = material
            .map((entry) => createSvgMaterial(source, entry, colorOverride))
            .filter(
                (entry): entry is THREE.Material =>
                    entry instanceof THREE.Material
            )

        return materials.length > 0 ? materials : undefined
    }

    if (!material.visible || material.opacity <= 0) {
        return
    }

    const color = colorOverride?.clone() ?? getMaterialColor(material, source)

    if (shouldRenderAsLine(source, getObjectGeometry(source))) {
        const lineMaterial = new THREE.LineBasicMaterial({
            color,
            opacity: material.opacity,
            transparent: material.transparent || material.opacity < 1,
        })

        if ("linewidth" in material && typeof material.linewidth === "number") {
            lineMaterial.linewidth = material.linewidth
        }

        return lineMaterial
    }

    return new THREE.MeshBasicMaterial({
        color,
        opacity: material.opacity,
        transparent: material.transparent || material.opacity < 1,
        side: "side" in material ? material.side : THREE.FrontSide,
        wireframe:
            "wireframe" in material ? Boolean(material.wireframe) : false,
    })
}

function getObjectGeometry(source: THREE.Object3D): THREE.BufferGeometry {
    return (source as any).geometry as THREE.BufferGeometry
}

function getObjectMaterial(
    source: THREE.Object3D | InstancedRenderable
): THREE.Material | THREE.Material[] {
    return (source as any).material as THREE.Material | THREE.Material[]
}

function getMaterialColor(
    material: THREE.Material,
    source: THREE.Object3D
): THREE.Color {
    if ("color" in material && material.color instanceof THREE.Color) {
        return material.color.clone()
    }

    return new THREE.Color(source instanceof THREE.Mesh ? 0xffffff : 0x000000)
}

function getInstanceColor(
    source: InstancedRenderable,
    index: number
): THREE.Color | undefined {
    if (!source.instanceColor || typeof source.getColorAt !== "function") {
        return
    }

    source.getColorAt(index, instanceColor)
    return instanceColor.clone()
}

function isInstancedRenderable(
    object: THREE.Object3D
): object is InstancedRenderable {
    return (
        "isInstancedMesh" in object &&
        object.isInstancedMesh === true &&
        "getMatrixAt" in object &&
        typeof object.getMatrixAt === "function"
    )
}

function isFatLineGeometry(geometry: THREE.BufferGeometry): boolean {
    return geometry.getAttribute("instanceStart") !== undefined
}

function shouldExportInstancedObjObject(source: InstancedRenderable): boolean {
    if (
        hasProjectionMaterial(source.material) ||
        hasFoldMaterial(source.material)
    ) {
        return true
    }

    if (source.renderOrder === orders.mesh) {
        return source instanceof THREE.Mesh
    }

    if (source.renderOrder === orders.line) {
        return true
    }

    return false
}

function shouldExportPlainObjObject(source: THREE.Object3D): boolean {
    return source === drafter.sectionCutter.mesh
}

function isGroundedObjLine(object: THREE.Object3D): object is THREE.Line {
    return object instanceof THREE.Line
}

function disposeSvgExportScene(exportScene: THREE.Scene): void {
    exportScene.traverse((object) => {
        const material = (object as any).material as
            | THREE.Material
            | THREE.Material[]
            | undefined

        disposeSvgMaterial(material)

        const geometry = (object as any).geometry as
            | THREE.BufferGeometry
            | undefined
        if (geometry?.userData.exportDisposable) {
            geometry.dispose()
        }
    })
}

function disposeObjExportScene(exportScene: THREE.Scene): void {
    exportScene.traverse((object) => {
        const geometry = (object as any).geometry as
            | THREE.BufferGeometry
            | undefined
        if (geometry?.userData.exportDisposable) {
            geometry.dispose()
        }
    })
}

function disposeSvgMaterial(
    material: THREE.Material | THREE.Material[] | undefined
): void {
    if (!material) {
        return
    }

    if (Array.isArray(material)) {
        for (let index = 0; index < material.length; index++) {
            material[index].dispose()
        }
        return
    }

    material.dispose()
}

export function downloadImage(
    filename = "drawing.png",
    maxRes = 4096 * 2
): void {
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
        downloadExport(filename, blob)
    }, "image/png")
}
