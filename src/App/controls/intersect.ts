import * as THREE from "three"
import { Brush } from "three-bvh-csg"
import type { CSGOperation } from "three-bvh-csg"

import { drafter, eventManager, selection } from "../AppContext"
import type { TransformNode } from "../objects/attachments"
import { evaluateCSG, boolean } from "../utils/csg"
import { deSelectAll } from "./interaction"

const _brushOffset = new THREE.Matrix4()

function createNodeBrush(node: TransformNode, yOffset = 0): Brush {
    const sourceBrush = drafter.getInstance(node.location.id).brush
    const brush = new Brush(sourceBrush.geometry)
    brush.matrixAutoUpdate = false
    brush.matrix.copy(node.compoundMatrix)
    if (yOffset !== 0) {
        brush.matrix.multiply(_brushOffset.makeTranslation(0, yOffset, 0))
    }
    brush.updateMatrixWorld(true)
    return brush
}

export function intersectTwoNodes(
    nodeA: TransformNode,
    nodeB: TransformNode,
    yOffset = 0,
    operation: CSGOperation = boolean.union
) {
    console.log(nodeA, nodeB)

    // Use temporary brushes so nodes that share an instance id still carry
    // independent transforms into the CSG evaluation.
    const instanceBrushA = createNodeBrush(nodeA)
    const instanceBrushB = createNodeBrush(nodeB, yOffset)

    try {
        const brushResult = evaluateCSG(
            instanceBrushB,
            instanceBrushA,
            operation
        )

        return brushResult
    } catch (err) {
        console.error("evaluateCSG fail", err)
        return
    }
}

const _offset = new THREE.Vector3(0, 0, -2)
export function startIntersection(
    startNode: TransformNode,
    operation = boolean.union
) {
    let squaredDist = Infinity
    let closestNode: TransformNode | undefined

    // find clsoest node and intersect it
    for (
        let bucketId = 0;
        bucketId < drafter.tree.freelist.length;
        bucketId++
    ) {
        const bucket = drafter.tree.freelist[bucketId]
        if (!bucket) continue

        for (let nodeIndex = 0; nodeIndex < bucket.count; nodeIndex++) {
            const candidate = bucket[nodeIndex] as TransformNode | undefined
            if (!candidate || candidate === startNode) continue

            const candidateDist = startNode.position.distanceToSquared(
                candidate.position
            )
            if (candidateDist < squaredDist) {
                squaredDist = candidateDist
                closestNode = candidate
            }
        }
    }
    console.log(closestNode)
    console.log(squaredDist)
    if (!closestNode) return
    if (squaredDist > 2) return
    const yOffset = startNode.position.z - closestNode.position.z
    const brushResult = intersectTwoNodes(
        startNode,
        closestNode,
        yOffset,
        operation
    )
    if (!brushResult) return

    const id = drafter.instanceItems.nextIndex()
    drafter.newInstance(brushResult.geometry)

    // add new root!
    const newNode = drafter.addLeafNode({
        position: startNode.position.clone().add(_offset),
        location: { id, index: -1 },
        parent: startNode,
    })

    drafter.updatePatchedNode(startNode)
}

export function startIntersectionFromFirst() {
    const node = selection.firstNode()
    if (!node) return
    startIntersection(node, boolean.intersection)
}

export function startUnionFromFirst() {
    const node = selection.firstNode()
    if (!node) return
    startIntersection(node, boolean.union)
}

export function startDifferenceFromFirst() {
    const node = selection.firstNode()
    if (!node) return
    startIntersection(node, boolean.difference)
}

function startIntersectionFromSelection(operation = boolean.union) {
    console.log(operation)
    if (selection.size > 2) {
        deSelectAll()
    }

    if (selection.size < 2) {
        console.log("select more nodes")
    }

    const items = selection.items()
    const [nodeA, nodeB] = items
    console.log(nodeA)
    console.log(nodeB.target)
    // eventManager.setTool("moveNode", nodeA.target, new THREE.Vector3())
}

export function startIntersectionFromSeleciton() {
    const node = selection.firstNode()
    if (!node) return
    startIntersectionFromSelection(boolean.intersection)
}
