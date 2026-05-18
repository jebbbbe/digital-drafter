import * as THREE from "three"
import { drafter, scene, interactionManager } from "../main"
import { constants } from "../constants"
import { getSlotIndex, type NodeLocation } from "../draft/TransformTree"
import type { TransformNode } from "../draft/TransformNode"
import * as rand from "../utils/random"
import { evaluateCSG, boolean } from "../utils/csg"

export function cutNodeFromSelection() {
    const selection = interactionManager.selection
    if (selection.length === 0) return
    const node = interactionManager.selection[0]
    if (!node) return
    cutNode(node)
}

const _up = new THREE.Vector3(0, 1, 0)
const _offset = new THREE.Vector3()
const _dir = new THREE.Vector3()
const s = 0.8

export function cutNode(node: TransformNode) {
    // add new line segment
    const sectionCutter = drafter.sectionCutter

    const nodeSlot = getSlotIndex(node.location)
    const mapItem = drafter.sectionCutter.locationMap.get(nodeSlot)

    _offset.z = rand.random(-0.25, 0.25)
    const t = rand.random(0, Math.PI * 2)
    const lineLen = s * 1.0
    const start = new THREE.Vector3(lineLen, 0, 0)
    const end = new THREE.Vector3(-lineLen, 0, 0)

    /*
        controls how the new line is added
        fisrt try parellel to parent, 
        then try parellel to first child, 
        then random. 
    
    */
    if (mapItem === undefined) {
        if (node.parent !== node) {
            // not a root
            _dir.subVectors(node.parent.position, node.position)
                .setY(0)
                .normalize()
            start.copy(_dir).multiplyScalar(lineLen)
            end.copy(_dir).multiplyScalar(-lineLen)
        } else if (node.children.length > 0) {
            // root with children
            _dir.subVectors(node.children[0].position, node.position)
                .setY(0)
                .normalize()
            start.copy(_dir).multiplyScalar(lineLen)
            end.copy(_dir).multiplyScalar(-lineLen)
        } else {
            start.add(_offset).applyAxisAngle(_up, t)
            end.add(_offset).applyAxisAngle(_up, t)
        }
    } else {
        start.add(_offset).applyAxisAngle(_up, t)
        end.add(_offset).applyAxisAngle(_up, t)
    }

    start.add(node.position)
    end.add(node.position)
    const midPoint = new THREE.Vector3()
        .addVectors(start, end)
        .multiplyScalar(0.5)

    // add new line segment
    const segmentIndex = sectionCutter.addSegmentVector(start, end, nodeSlot)

    // SECTION
    const id = node.location.id
    const instanceItem = drafter.instanceItems[id]
    if (!instanceItem) return

    // get brush from instance
    const instanceBrush = instanceItem.brush
    instanceBrush.matrixAutoUpdate = false
    const prevMatrix = instanceBrush.matrix.clone()
    instanceBrush.matrix.copy(node.compoundMatrix)
    instanceBrush.updateMatrixWorld(true)

    // get brush from sectionCutter
    const boxBrush = sectionCutter.brush
    boxBrush.matrixAutoUpdate = false
    boxBrush.matrix.identity()

    // determine Box Matrix
    const dir = new THREE.Vector3()
        .subVectors(end, midPoint)
        .setY(0)
        .normalize()
    let angle = Math.atan2(dir.x, dir.z)
    if (angle < 0) angle += Math.PI * 2

    const size = 50
    const move1 = new THREE.Matrix4().makeTranslation(0.5, 0, 0)
    const scale = new THREE.Matrix4().makeScale(size, size, size)
    const rotate = new THREE.Matrix4().makeRotationY(angle)
    const move2 = new THREE.Matrix4().makeTranslation(midPoint)
    boxBrush.matrix.copy(move2).multiply(rotate).multiply(scale).multiply(move1)
    boxBrush.updateMatrixWorld(true)

    // debug, preview the mesh
    //@ts-ignore
    // drafter.boxDebug.matrix.copy(boxBrush.matrix)

    // evaluate
    const brush1 = evaluateCSG(instanceBrush, boxBrush, boolean.intersection)

    //remove matrix world
    instanceBrush.matrix.copy(prevMatrix)
    instanceBrush.updateMatrixWorld(true)

    // add instance
    const side1ID = drafter.instanceItems.nextIndex()
    drafter.newInstance(brush1.geometry)

    // determine root position
    const lineDir = new THREE.Vector3()
        .subVectors(end, start)
        .setY(0)
        .normalize()

    const perp = new THREE.Vector3(-lineDir.z, 0, lineDir.x)
    const distance = 1.75

    const side1pos = new THREE.Vector3()
        .copy(node.position)
        .addScaledVector(perp, -distance)

    // add new root
    const side1Root: Partial<TransformNode> = {
        position: side1pos,
        location: { id: side1ID, index: -1 },
        parent: node,
    }

    // add new root!
    const newNode = drafter.addRootNode(side1Root)
    if (!newNode) return
    //set child location on segment
    const side1Slot = getSlotIndex(newNode.location)
    // add ref here for deletion/edit of children
    sectionCutter.segmentNodeChildrenSlots[segmentIndex / 2] = side1Slot
}
