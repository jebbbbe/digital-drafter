import * as THREE from "three"
import { Brush, Evaluator, INTERSECTION } from "three-bvh-csg"

export type BvhBooleanTest = {
    update: (time: number) => void
}

const evaluator = new Evaluator()
evaluator.attributes = ["position"]
evaluator.useGroups = false

const RESULT_INSTANCE_COUNT = 20

function evaluateBrushes(
    originalBrush: Brush,
    cutterBrush: Brush,
    resultBrush: Brush
): void {
    evaluator.evaluate(originalBrush, cutterBrush, INTERSECTION, resultBrush)
}

export function createBvhBooleanTest(
    scene: THREE.Scene,
    geom: THREE.BufferGeometry,
    origin: THREE.Vector3 = new THREE.Vector3(0, 15, 0)
): BvhBooleanTest {
    const sourceGeometry = geom.clone()
    sourceGeometry.computeBoundingBox()
    const baseOrigin = origin.clone()

    const bounds = sourceGeometry.boundingBox ?? new THREE.Box3()
    const size = bounds.getSize(new THREE.Vector3())
    const maxDimension = Math.max(size.x, size.y, size.z, 1)
    const cutterSize = Math.max(maxDimension * 0.25, 1)
    const motionRadius = Math.max(maxDimension * 0.35, 0.8)

    const originalMaterial = new THREE.MeshBasicMaterial({
        color: "#9bbcff",
        wireframe: true,
    })
    const resultMaterial = new THREE.MeshBasicMaterial({ color: "#1c6d0c" })
    const cutterGeometry = new THREE.BoxGeometry(
        cutterSize,
        cutterSize,
        cutterSize
    )
    const cutterMaterial = new THREE.MeshBasicMaterial({
        color: "#ff5577",
        wireframe: true,
    })

    const originalMesh = new THREE.Mesh(sourceGeometry, originalMaterial)
    const cutterMesh = new THREE.Mesh(cutterGeometry, cutterMaterial)
    const resultBrush = new Brush(sourceGeometry.clone())
    const resultMesh = new THREE.InstancedMesh(
        resultBrush.geometry,
        resultMaterial,
        RESULT_INSTANCE_COUNT
    )

    const originalBrush = new Brush(sourceGeometry)
    const cutterBrush = new Brush(cutterGeometry)

    for (let i = 0; i < RESULT_INSTANCE_COUNT; i++) {
        resultMesh.setMatrixAt(i, new THREE.Matrix4().makeTranslation(0, i * 3, 0))
    }
    resultMesh.count = RESULT_INSTANCE_COUNT
    resultMesh.instanceMatrix.needsUpdate = true

    originalBrush.prepareGeometry()
    cutterBrush.prepareGeometry()

    originalMesh.frustumCulled = false
    cutterMesh.frustumCulled = false
    resultMesh.frustumCulled = false

    originalMesh.position.copy(baseOrigin)
    resultMesh.position.copy(baseOrigin)

    scene.add(originalMesh, cutterMesh, resultMesh)

    function syncBrushTransform(mesh: THREE.Mesh, brush: Brush): void {
        brush.position.copy(mesh.position)
        brush.quaternion.copy(mesh.quaternion)
        brush.scale.copy(mesh.scale)
        brush.updateMatrixWorld()
    }

    const speedScale = 0.25

    function setCutterPosition(time: number): void {
        originalMesh.updateMatrixWorld()
        syncBrushTransform(originalMesh, originalBrush)

        cutterMesh.position.set(
            baseOrigin.x + Math.cos(time * 1.15 * speedScale) * motionRadius,
            baseOrigin.y,
            baseOrigin.z + Math.sin(time * 0.8 * speedScale) * motionRadius
        )
        cutterMesh.updateMatrixWorld()
        syncBrushTransform(cutterMesh, cutterBrush)
    }

    function rebuildResult(): void {
        evaluateBrushes(originalBrush, cutterBrush, resultBrush)
        resultMesh.geometry = resultBrush.geometry

        resultMesh.position.copy(resultBrush.position)
        resultMesh.quaternion.copy(resultBrush.quaternion)
        resultMesh.scale.copy(resultBrush.scale)
    }

    setCutterPosition(0)
    rebuildResult()

    return {
        update(time: number) {
            setCutterPosition(time)
            rebuildResult()
        },
    }
}
