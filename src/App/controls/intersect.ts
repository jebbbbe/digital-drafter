import * as THREE from "three"
import { Brush } from "three-bvh-csg"
import type { CSGOperation } from "three-bvh-csg"

import { controllers, drafter, eventManager, selection } from "../AppContext"
import type { TransformNode, ToolId } from "@types"
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

function intersectFromNodes(nodes: TransformNode[], operation = boolean.union) {
    const [nodeA, nodeB, nodeC, nodeD] = nodes
    const d1 = nodeA.position.distanceTo(nodeC.position)
    const d2 = nodeB.position.distanceTo(nodeD.position)
    const zOffset = d1 - d2
    const brushResult = intersectTwoNodes(nodeC, nodeD, zOffset, operation)
    if (!brushResult) return
    const id = drafter.instanceItems.nextIndex()
    drafter.newInstance(brushResult.geometry)
    const nodeE = drafter.addLeafNode({
        position: nodeC.position.clone().add(_offset),
        location: { id, index: -1 },
        parent: nodeC,
    })
    if (!nodeE) {
        return
    }

    nodes.push(nodeE)
    // const intersectAttachment = {
    // 	nodes,
    // 	operation,
    // }
    // nodeA.attachments.intersect = intersectAttachment
    // nodeB.attachments.intersect = intersectAttachment
    // nodeC.attachments.intersect = intersectAttachment
    // nodeD.attachments.intersect = intersectAttachment
    // nodeE.attachments.intersect = intersectAttachment
    return nodeE
}

function intersectTwoNodes(
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

function createUserToolPromise(tool: ToolId, ...args: unknown[]) {
    return new Promise<void>((resolve, reject) => {
        eventManager.setTool(tool, ...args, resolve, () =>
            reject(new Error(`${tool} cancelled`))
        )
    })
}

async function _startIntersectionFromSelection(operation = boolean.union) {
    if (selection.size > 2) {
        deSelectAll()
    }

    let items = selection.filter("TransformNode")
    if (items.length !== 2) {
        console.log("select more nodes")
        try {
            await createUserToolPromise("selectCount", 2)
        } catch {
            exitIntersectionClean()
            return
        }
        items = selection.filter("TransformNode")
    }
    /*

		A,B
		c,D

		A is first seleccted that gets the oepration appied to it.
		A -> C
		B -> D

		any move will recalc the intersection in recusive call.
		

	*/

    const [nodeA, nodeB] = items

    console.log(nodeA)
    console.log(nodeB)

    const partialA = {
        position: nodeA.position.clone().add(_offset),
    }
    const partialB = {
        position: nodeB.position.clone().add(_offset),
    }

    const nodeC = drafter.addLeafNode(partialA, nodeA)
    const nodeD = drafter.addLeafNode(partialB, nodeB)
    if (!nodeC || !nodeD) {
        exitIntersectionClean()
        return
    }
    selection.clear()
    selection.add(nodeC)
    selection.add(nodeD)
    controllers.useTransformControls = false

    try {
        await createUserToolPromise("moveAttached")
    } catch {
        exitIntersectionClean()
        return
    }
    selection.remove(nodeD)

    try {
        // CONSTRAINED MOVE HERE
        console.warn("contrain not implemented")
        await createUserToolPromise("moveAttached")
    } catch {
        exitIntersectionClean()
        return
    }

    const nodes = [nodeA, nodeB, nodeC, nodeD]
    const nodeE = intersectFromNodes(nodes, operation)
    if (!nodeE) {
        exitIntersectionClean()
        return
    }

    selection.clear()
    selection.add(nodeE)
    try {
        await createUserToolPromise("moveAttached")
    } catch {
        exitIntersectionClean()
        return
    }

    exitIntersectionClean()
    return
}

function exitIntersectionClean() {
    controllers.useTransformControls = true
    deSelectAll()
    eventManager.setTool("select")
}

export function startIntersectionFromSeleciton() {
    _startIntersectionFromSelection(boolean.union)
}
