import * as THREE from "three"
import { drafter, scene, interactionManager } from "../main"
import { constants } from "../constants"
import type { TransformNode } from "../draft/TransformNode"

export function cutNodeFromSelection() {
    const selection = interactionManager.selection
    if (selection.length === 0) return
    const node = interactionManager.selection[0]
    if (!node) return
    cutNode(node)
}

export function cutNode(node: TransformNode) {
    // add new line segment
    const s = 0.8
    const start = new THREE.Vector3(s, 0, 0).add(node.position)
    const end = new THREE.Vector3(-s, 0, 0).add(node.position)
    drafter.sectionCutter.addSegmentVector(start, end)
    console.log({ start, end })

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
