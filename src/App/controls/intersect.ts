import * as THREE from "three"
import { Brush } from "three-bvh-csg"
import type { CSGOperation } from "three-bvh-csg"

import { controllers, drafter, eventManager, selection } from "../AppContext"
import type { TransformNode } from "@types"
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
    const brushResult = intersectTwoNodes(nodeD, nodeC, zOffset, operation)
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
    // nodeA.position.y = zOffset //	 align drawing depth with z offset...?
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
    const instanceBrushB = createNodeBrush(nodeB)

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

async function startOperationFromSelection(operation = boolean.union) {
    if (selection.size > 2) {
        deSelectAll()
    }

    let items = selection.filter("TransformNode")
    controllers.useTransformControls = false
    if (items.length !== 2) {
        console.log("select more nodes")
        let success = await eventManager.setToolAsync("selectCount", 2)
        items = selection.filter("TransformNode")
        success = success && items.length === 2
        if (!success) {
            exitIntersectionClean()
            return
        }
    }
    /*
		A,B
		c,D
		A is first seleccted that gets the oepration appied to it.
		A -> C
		B -> D
		any move will recalc the intersection in recusive call.
		how t odeal with nodes part of multiple ABCD...?
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

    if (!(await eventManager.setToolAsync("moveAttached"))) {
        exitIntersectionClean()
        return
    }
    selection.remove(nodeC)

    // CONSTRAINED MOVE HERE
    console.warn("contrain not implemented")
    if (!(await eventManager.setToolAsync("moveAttached"))) {
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
    if (!(await eventManager.setToolAsync("moveAttached"))) {
        exitIntersectionClean()
        return
    }

    controllers.useTransformControls = true
    eventManager.setTool("select")
    return
}

function exitIntersectionClean() {
    controllers.useTransformControls = true
    deSelectAll()
    eventManager.setTool("select")
}

export const bUnionFromSeleciton = () =>
    startOperationFromSelection(boolean.union)
export const bDifferenceFromSeleciton = () =>
    startOperationFromSelection(boolean.difference)
export const bIntersectionFromSeleciton = () =>
    startOperationFromSelection(boolean.intersection)
