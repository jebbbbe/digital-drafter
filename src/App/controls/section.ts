import * as THREE from "three"
import { LineMaterial } from "three/addons/lines/LineMaterial.js"
import { LineSegments2 } from "three/addons/lines/LineSegments2.js"
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js"
import { drafter, scene, interactionManager } from "../main"
import { constants } from "../constants"
import { getSlotIndex } from "../objects/textures/GlobalTreeTexture"
import type { TransformNode } from "../draft/TransformNode"
import * as rand from "../utils/random"
import { evaluateCSG, boolean, csgEvaluator } from "../utils/csg"
import type { SectionSegment } from "../interaction/selectionManager"
import { getNodeLocationFromSlot } from "../objects/textures/GlobalTreeTexture"
import { createSegmentAttachment } from "../draft/NodeAttachments"
import { createSectionAttachment } from "../draft/NodeAttachments"

export function cutNodeFromSelection() {
    const node = interactionManager.selection.firstNode()
    console.log(node)
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

    // see if children have cuts
    let noCuts = true
    const children = node.children
    for (let i = 0; i < children.length; i++) {
        const child = children[i]
        const len = drafter.attachments.getByKind(child, "segment").length
        if (len !== 0) {
            noCuts = false
            break
        }
    }

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

    if (noCuts) {
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

    // SECTION
    const id = node.location.id
    const instanceItem = drafter.instanceItems[id]
    if (!instanceItem) return

    // get brush from instance
    const instanceBrush = instanceItem.brush
    const prevMatrix = instanceBrush.matrix.clone()
    instanceBrush.matrix.copy(node.compoundMatrix)
    instanceBrush.updateMatrixWorld(true)

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
    const boxBrush = sectionCutter.brush
    boxBrush.matrix.identity()
    boxBrush.matrix.copy(move2).multiply(rotate).multiply(scale).multiply(move1)
    boxBrush.updateMatrixWorld(true)

    // debug, preview the mesh
    //@ts-ignore
    if (drafter.debug.enable) {
        drafter.debug.objects.section.matrix.copy(boxBrush.matrix)
    }

    // evaluate
    let brush1
    try {
        brush1 = evaluateCSG(instanceBrush, boxBrush, boolean.intersection)
    } catch (err) {
        console.error("evaluateCSG fail", err)
        cleanUp()
        return
    }

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
        .addScaledVector(perp, distance)

    // add new root
    const side1Root: Partial<TransformNode> = {
        position: side1pos,
        location: { id: side1ID, index: -1 },
        parent: node,
        type: "sectionChild",
    }

    // add new root!
    const newNode = drafter.addLeafNode(side1Root)
    if (!newNode) return

    // add new line segment
    const segmentIndex = sectionCutter.addSegmentVector(start, end, newNode)

    // node attachment
    const segmentAttachment = createSegmentAttachment(
        sectionCutter,
        segmentIndex
    )
    drafter.attachments.add(newNode, segmentAttachment)

    //Section face
    csgEvaluator.debug.enabled = true
    let face1Brush
    let faceEdges = new LineSegments2(
        new LineSegmentsGeometry(),
        new LineMaterial()
    )
    try {
        //faces
        face1Brush = evaluateCSG(
            boxBrush,
            instanceBrush,
            boolean.hollowIntersection
        )
        // lines
        const edges = csgEvaluator.debug.intersectionEdges
        const positions = edges.flatMap((e) => [
            e.start.x,
            e.start.y,
            e.start.z,
            e.end.x,
            e.end.y,
            e.end.z,
        ])
        faceEdges.geometry.setPositions(positions)
    } catch (err) {
        console.error("evaluateCSG fail", err)
        cleanUp()
        return
    }

    // geo is created using boxBrush transform. we must undo and apply from new node and node
    // let faceMatrix = face1Brush.matrix.clone()
    let faceMatrix = new THREE.Matrix4()
        .copy(newNode.compoundMatrix)
        .multiply(new THREE.Matrix4().copy(node.compoundMatrix).invert())
        .multiply(face1Brush.matrix)

    //face
    const face1 = new THREE.Mesh(
        face1Brush.geometry,
        // drafter.materials.mesh
        new THREE.MeshBasicMaterial({
            color: 0xd8abd8,
            side: THREE.DoubleSide,
            depthWrite: false,
            depthTest: false, // nice result on/off
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1,
        })
    )
    face1.renderOrder = 2

    //edges
    faceEdges.material = new LineMaterial({
        color: 0x000000,
        depthTest: true,
        depthWrite: false,
        linewidth: 2,
    })
    faceEdges.material.resolution.set(window.innerWidth, window.innerHeight)
    faceEdges.onBeforeRender = () => {
        faceEdges.material.resolution.set(window.innerWidth, window.innerHeight)
    }

    // add to scene...
    let group = new THREE.Group()
    group.add(face1)
    group.add(faceEdges)
    group.matrixAutoUpdate = false
    group.matrix = faceMatrix

    drafter.scene.add(group)

    const attachment = createSectionAttachment(group)
    drafter.attachments.add(newNode, attachment)

    // change type on parent node
    node.type = "sectionParent"
    //cleanup
    cleanUp()
    function cleanUp() {
        // remove csg debug for edges
        csgEvaluator.debug.enabled = false
        //remove matrix world
        instanceBrush.matrix.copy(prevMatrix)
        instanceBrush.updateMatrixWorld(true)
    }
}

export function deleteSegment(line: SectionSegment) {
    const index = line.index
    const sectionCutter = drafter.sectionCutter
    const node = sectionCutter.nodeMap.get(index)
    if (!node) return

    sectionCutter.deleteSegment(index)

    const children = node.children as TransformNode[]

    for (let i = 0; i < children.length; i++) {
        drafter.detachNode(children[i])
    }

    drafter.pruneNode(node)
}
