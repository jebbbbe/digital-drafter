import * as THREE from "three"
import { drafter, scene, interactionManager } from "../main"
import { constants } from "../constants"
import { getSlotIndex } from "../draft/TransformTree"
import type { TransformNode } from "../draft/TransformNode"
import * as rand from "../utils/random"

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

    const nodeSlot = getSlotIndex(node.location)
    const mapItem = drafter.sectionCutter.locationMap.get(nodeSlot)

    _offset.z = rand.random(-0.25, 0.25)
    const t = rand.random(0, Math.PI * 2)
    const lineLen = s * 1.0
    const start = new THREE.Vector3(lineLen, 0, 0)
    const end = new THREE.Vector3(-lineLen, 0, 0)

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
    drafter.sectionCutter.addSegmentVector(start, end, nodeSlot)

    /*
        // bvh geo
        geo1 = geometryCutter.booleanShape({
            geometry: geo,
            matrix: matrix,
            pointA,
            pointB,
        })

        geo2 = geometryCutter.booleanShape({
            geometry: geo,
            matrix: matrix,
            pointA,
            pointB,
        })

        const side1ID = drafter.addInstance(geo1)
        const side2ID = drafter.addInstance(geo2)

        // add nodes
        const side1pos = new THREE.Vector3(0, 0, -4).sub(node.position)
        const side2pos = new THREE.Vector3(0, 0, 4).sub(node.position)

        const side1Root = {
            position: side1pos,
            location: { id: side1ID, index: -1 },
            parent: node,
        }

        const side2Root = {
            position: side2pos,
            location: { id: side2ID, index: -1 },
            parent: node,
        }

        drafter.addRoot(side1Root)
        drafter.addRoot(side2Root)
        */
}
/*
export function moveCutter() {
    
    // move cutter from an index.
    if(move0) geometryCutter.move(index, delta)
    if(move1) geometryCutter.move(index, delta)

    //update BVH
    const node = drafter.getnodde( cutter.getNode() )
    
    //NEED some way to get children that are results of cuts. 
    cosnt cutChildren[]

    // update
    const instanceIDs = []
    for  cutChildren{
        instanceIDs.push()
    }

    for  instanceIDs{
        const id = intsnceIds[i]
        const instance = drafter.isntanceIDs[id]
        .....
        drafter.patchIsntance(nnewGeo, id)
    }
    // no need for dfs as nothign about matrix position changes?
}
    */
