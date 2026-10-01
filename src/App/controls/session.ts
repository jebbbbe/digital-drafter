import * as THREE from "three"
import { drafter, controllers, scene } from "../AppContext"
import { createNewCutNode } from "./section"
import { intersectFromNodes } from "./intersect"
import { boolean } from "../utils/csg"
import { geometryLibrary } from "../objects/geometries/library"
import * as rand from "../utils/random"
import type { NodeLocation, TransformNode } from "@types"
import type { Drafter } from "../draft/Drafter"
import { NEWSectionCutter } from "../interactive/sl"

let prod = !import.meta.env.DEV

export function setUpDrafter() {
    // add default starting scene.
    // can replace later with  session specific loading logic.
    // we do not have a ssave/load scheme
    let t = new NEWSectionCutter(scene)
    const geometryItems = Object.values(geometryLibrary) as [
        THREE.BufferGeometry,
        ...THREE.BufferGeometry[],
    ]
    if (prod) {
        // make default mesh the rectangle in prod
        console.log({ geometryItems })
        geometryItems.splice(3, geometryItems.length)
        geometryItems.shift()
    }
    geometryItems.pop()

    for (let i = 0; i < 3; i++) {
        drafter.newInstance(rand.randomItem(geometryItems))
    }

    const scale = 1 // rand.random(0.75, 1.5)
    const initalTransform = new THREE.Matrix4()
        .makeRotationX(
            rand.randomItem([0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2])
            // rand.random(0, Math.PI * 2)
        )
        .scale(new THREE.Vector3(scale, scale, scale))

    const initalTrees: Array<{
        root: Partial<TransformNode>
        leafs: Array<{ node: Partial<TransformNode>; parent: NodeLocation }>
    }> = [
        {
            root: {
                position: new THREE.Vector3(0, 0, 0),
                location: { id: 0, index: -1 },
                baseMatrix: initalTransform.clone(),
            },
            // prettier-ignore
            leafs: [
				{ node:{position: new THREE.Vector3(2, 0, 2),   }, parent:{ id:0, index: 0 }},
				{ node:{position: new THREE.Vector3(2, 0, 0),   }, parent:{ id:0, index: 1 }},
				{ node:{position: new THREE.Vector3(2, 0, -2),  }, parent:{ id:0, index: 2 }},
				{ node:{position: new THREE.Vector3(-2, 0, -2), }, parent:{ id:0, index: 0 }},
				{ node:{position: new THREE.Vector3(-2, 0, 2),  }, parent:{ id:0, index: 0 }},
				// { node:{position: new THREE.Vector3(4, 0, 0),  }, parent:{ id:0, index: 2 }},
				{ node:{position: new THREE.Vector3(-4, 0, 0), }, parent:{ id:0, index: 0 }},
				{ node:{position: new THREE.Vector3(-4, 0, 2), }, parent:{ id:0, index: 5 }},
				{ node:{position: new THREE.Vector3(-4, 0, -2), }, parent:{ id:0, index: 4 }},
				{ node:{position: new THREE.Vector3(1.7, 0, -2.05), }, parent:{ id:0, index: 0}},
			],
        },
        {
            root: {
                position: new THREE.Vector3(4, 0, 4),
                location: { id: 0, index: -1 },
                baseMatrix: initalTransform.clone(),
            },
            // prettier-ignore
            leafs: [],
        },
        {
            root: {
                position: new THREE.Vector3(-4, 0, 4),
                location: { id: 0, index: -1 },
                baseMatrix: initalTransform.clone(),
            },
            // prettier-ignore
            leafs: [],
        },

        {
            root: {
                position: new THREE.Vector3(4, 0, -4),
                location: { id: 1, index: -1 },
                baseMatrix: initalTransform.clone(),
            },
            // prettier-ignore
            leafs: [
				{ node:{position: new THREE.Vector3(6, 0, -4),   }, parent:{ id:1, index: 0 }},
				{ node:{position: new THREE.Vector3(6, 0, -2),   }, parent:{ id:1, index: 1 }},
				{ node:{position: new THREE.Vector3(8, 0, -2),   }, parent:{ id:1, index: 2 }},
				{ node:{position: new THREE.Vector3(6, 0, 0),   }, parent:{ id:1, index: 3 }},
				{ node:{position: new THREE.Vector3(6, 0, 2),   }, parent:{ id:1, index: 4 }},
				{ node:{position: new THREE.Vector3(8, 0, 0),   }, parent:{ id:1, index: 2 }},
				{ node:{position: new THREE.Vector3(8, 0, 2),   }, parent:{ id:1, index: 6 }},
				{ node:{position: new THREE.Vector3(8, 0, -4),   }, parent:{ id:1, index: 3 }},
			],
        },
        {
            root: {
                position: new THREE.Vector3(-4, 0, -4),
                location: { id: 1, index: -1 },
                baseMatrix: new THREE.Matrix4(),
            },
            // prettier-ignore
            leafs: [],
        },
        {
            root: {
                position: new THREE.Vector3(-6, 0, -4),
                location: { id: 2, index: -1 },
                baseMatrix: initalTransform.clone(),
            },
            // prettier-ignore
            leafs: [
				{ node:{position: new THREE.Vector3(-6, 0, -2),   }, parent:{ id:2, index: 0 }},
				{ node:{position: new THREE.Vector3(-8, 0, -2),   }, parent:{ id:2, index: 1 }},
				{ node:{position: new THREE.Vector3(-6, 0, 0),   }, parent:{ id:2, index: 2 }},
				{ node:{position: new THREE.Vector3(-6, 0, 2),   }, parent:{ id:2, index: 3 }},
				{ node:{position: new THREE.Vector3(-8, 0, 0),   }, parent:{ id:2, index: 1 }},
				{ node:{position: new THREE.Vector3(-8, 0, 2),   }, parent:{ id:2, index: 5 }},
				{ node:{position: new THREE.Vector3(-8, 0, -4),   }, parent:{ id:2, index: 2 }},
			],
        },
    ]

    if (prod) {
        initalTrees.splice(1, initalTrees.length)
    }

    // add sample nodes
    addTrees(drafter, initalTrees)

    // Section Cut Node Tests
    let nodeToCut
    nodeToCut = drafter.findNode({ id: 0, index: 4 })
    if (nodeToCut) createNewCutNode(nodeToCut)

    // nodeToCut = drafter.findNode({ id: 0, index: 6 })
    nodeToCut = drafter.findNode({ id: 0, index: 2 })
    if (nodeToCut) {
        const sectionChild = createNewCutNode(nodeToCut)
        const segment = sectionChild?.attachments.segment

        if (sectionChild && segment) {
            const delta = new THREE.Vector3(0.25, 0, 0)
            segment.sectionCutter.moveSegmentVector(delta, delta, segment.index)
            drafter.updatePatchedNode(sectionChild)
        }
    }

    /*
    nodeToCut = drafter.findNode({ id: 1, index: 4 })
    if (nodeToCut) createNewCutNode(nodeToCut)

    nodeToCut = drafter.findNode({ id: 2, index: 5 })
    if (nodeToCut) createNewCutNode(nodeToCut)
	*/

    // Boolean Tests
    const nodeA = drafter.findNode({ id: 0, index: 3 })
    const nodeB = drafter.findNode({ id: 0, index: 9 })
    if (nodeA && nodeB) {
        const offset = new THREE.Vector3(0, 0, -2)
        const nodeC = drafter.addLeafNode(
            { position: nodeA.position.clone().add(offset) },
            nodeA
        )
        const nodeD = drafter.addLeafNode(
            { position: nodeB.position.clone().add(offset) },
            nodeB
        )

        if (nodeC && nodeD) {
            intersectFromNodes(
                [nodeA, nodeB, nodeC, nodeD],
                boolean.difference,
                new THREE.Vector3(-2, 0, 0)
            )
        }
    }
}

function addTrees(drafter: Drafter, trees: any) {
    for (let i = 0; i < trees.length; i++) {
        const tree = trees[i].root
        drafter.addRootNode(tree)
        const leafs = trees[i].leafs
        for (let i = 0; i < leafs.length; i++) {
            const leaf = leafs[i]
            drafter.addLeafNode(leaf.node, leaf.parent)
        }
    }
}
