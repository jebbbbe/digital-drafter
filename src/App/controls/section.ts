import * as THREE from "three"
import { LineSegments2 } from "three/addons/lines/LineSegments2.js"
import { drafter, interactionManager } from "../main"
import {
    createSectionAttachment,
    createSegmentAttachment,
    type TransformNode,
} from "../draft/TransformNode"
import * as rand from "../utils/random"
import { evaluateCSG, boolean, csgEvaluator } from "../utils/csg"
import type { SectionSegment } from "../interaction/selectionManager"
import type { InstanceItem } from "../draft/InstanceItem"
import { SectionFaceGroup } from "../objects/meshes/sectionFaceGroup"

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

const _midPoint = new THREE.Vector3()
const _dir2 = new THREE.Vector3()

const _move1 = new THREE.Matrix4()
const _scale = new THREE.Matrix4()
const _rotate = new THREE.Matrix4()
const _move2 = new THREE.Matrix4()

function cutGeometry(
    // start: THREE.Vector3,
    // end: THREE.Vector3,
    // instanceItem: InstanceItem,
    // sectionParent: TransformNode,
    sectionChild: TransformNode,
    offset: number = 0
) {
    // if node is mirrored, invert distance
    // offset *= sectionChild.mirror

    const instanceItem = drafter.instanceItems[sectionChild.parent.location.id]
    if (!instanceItem) return
    const instanceBrush = instanceItem.brush
    const prevMatrix = instanceBrush.matrix.clone()

    instanceBrush.matrix.copy(sectionChild.compoundMatrix) // this needs to move by offset in y direction
    instanceBrush.updateMatrixWorld(true)

    const boxBrush = drafter.sectionCutter.brush

    try {
        //@ts-ignore
        csgEvaluator.useCDTClipping = true
        const brush1 = evaluateCSG(
            instanceBrush,
            boxBrush,
            boolean.intersection
        )
        //@ts-ignore
        csgEvaluator.useCDTClipping = false
        csgEvaluator.debug.enabled = true
        const face1Brush = evaluateCSG(
            boxBrush,
            instanceBrush,
            boolean.hollowIntersection
        )

        const edges = csgEvaluator.debug.intersectionEdges
        const positions = edges.flatMap((e) => [
            e.start.x,
            e.start.y,
            e.start.z,
            e.end.x,
            e.end.y,
            e.end.z,
        ])

        // console.log("")
        // console.log(brush1.geometry.drawRange.count)
        // console.log(brush1.geometry.getAttribute("position")?.count)
        // console.log(brush1.geometry.index?.count)
        // console.log(face1Brush.geometry.drawRange.count)
        // console.log(face1Brush.geometry.getAttribute("position")?.count)
        // console.log(face1Brush.geometry.index?.count)

        return { face1Brush, brush1, positions }
    } catch (err) {
        console.error("evaluateCSG fail", err)
        return
    } finally {
        csgEvaluator.debug.enabled = false
        instanceBrush.matrix.copy(prevMatrix)
        instanceBrush.updateMatrixWorld(true)
    }
}

const _start = new THREE.Vector3()
const _end = new THREE.Vector3()
export function cutNode(sectionParent: TransformNode) {
    const sectionCutter = drafter.sectionCutter

    // see if children have cuts
    let noCuts = true
    const children = sectionParent.children
    for (let i = 0; i < children.length; i++) {
        const child = children[i]
        const segment = child.attachments.segment
        if (segment !== undefined) {
            noCuts = false
            break
        }
    }

    _offset.z = rand.random(-0.25, 0.25)
    const t = rand.random(0, Math.PI * 2)
    const lineLen = s * 1.0
    _start.x = lineLen
    _end.x = -lineLen

    /*
        controls how the new line is added
        fisrt try parellel to parent, 
        then try parellel to first child, 
        then random. 
    
    */

    if (noCuts) {
        if (sectionParent.parent !== sectionParent) {
            // not a root
            _dir.subVectors(
                sectionParent.parent.position,
                sectionParent.position
            )
                .setY(0)
                .normalize()
            _start.copy(_dir).multiplyScalar(lineLen)
            _end.copy(_dir).multiplyScalar(-lineLen)
        } else if (sectionParent.children.length > 0) {
            // root with children
            _dir.subVectors(
                sectionParent.children[0].position,
                sectionParent.position
            )
                .setY(0)
                .normalize()
            _start.copy(_dir).multiplyScalar(lineLen)
            _end.copy(_dir).multiplyScalar(-lineLen)
        } else {
            _start.add(_offset).applyAxisAngle(_up, t)
            _end.add(_offset).applyAxisAngle(_up, t)
        }
    } else {
        _start.add(_offset).applyAxisAngle(_up, t)
        _end.add(_offset).applyAxisAngle(_up, t)
    }

    _start.add(sectionParent.position)
    _end.add(sectionParent.position)

    // SECTION

    // add instance
    const id = sectionParent.location.id
    const parentInstanceItem = drafter.instanceItems[id]
    if (!parentInstanceItem) return

    const childId = drafter.instanceItems.nextIndex()
    drafter.newInstance(parentInstanceItem.geometry.clone()) // hmmm

    // determine root position
    const lineDir = new THREE.Vector3()
        .subVectors(_end, _start)
        .setY(0)
        .normalize()

    const perp = new THREE.Vector3(-lineDir.z, 0, lineDir.x)
    const distance = 1.75

    const side1pos = new THREE.Vector3()
        .copy(sectionParent.position)
        .addScaledVector(perp, distance)

    // add new root
    const side1Root: Partial<TransformNode> = {
        position: side1pos,
        location: { id: childId, index: -1 },
        parent: sectionParent,
        sectionChild: true,
    }

    // add new root!
    const sectionChild = drafter.addLeafNode(side1Root)
    if (!sectionChild) {
        // delete new instance..?
        return
    }

    // do cut
    const cutResult = cutGeometry(sectionChild, 0)
    if (!cutResult) {
        // delete isntance
        return
    }
    const { brush1, face1Brush, positions } = cutResult

    // update instance geometry
    drafter.patchInstanceGeometry(childId, brush1.geometry)

    // attacchments
    const sectionFace = new SectionFaceGroup()
    sectionFace.edges.geometry.setPositions(positions)
    sectionFace.setFaceGeometry(face1Brush.geometry)

    // add new line segment
    const segmentIndex = sectionCutter.addSegmentVector(
        _start,
        _end,
        sectionChild
    )

    // node attachment
    const segmentAttachment = createSegmentAttachment(
        sectionCutter,
        segmentIndex
    )
    sectionChild.attachments.segment = segmentAttachment

    // geo is created using boxBrush transform. we must undo and apply from new node and node
    // let faceMatrix = face1Brush.matrix.clone()
    // let faceMatrix = new THREE.Matrix4()
    //     .copy(sectionChild.compoundMatrix)
    //     .multiply(
    //         new THREE.Matrix4().copy(sectionParent.compoundMatrix).invert()
    //     )
    //     .multiply(face1Brush.matrix)
    // sectionFace.setMatrix(faceMatrix)

    // sectionFace.setMatrix(sectionChild.compoundMatrix)

    drafter.scene.add(sectionFace)

    const attachment = createSectionAttachment(sectionFace)
    sectionChild.attachments.section = attachment

    // mark parent node as the source of a section cut
    sectionParent.sectionParent = true
}

export function updateCutNode(
    start: THREE.Vector3,
    end: THREE.Vector3,
    sectionChild: TransformNode
) {
    const sectionParent = sectionChild.parent
    const childId = sectionChild.location.id
    const parentId = sectionParent.location.id

    // SECTION
    const instanceItem = drafter.instanceItems[parentId]
    if (!instanceItem) return

    const attachment = sectionChild.attachments.section
    if (!attachment) return

    const group = attachment.object

    const offset = 0
    const cutResult = cutGeometry(sectionChild, offset)
    if (!cutResult) return
    const { brush1, face1Brush, positions } = cutResult

    // update instance geometry
    drafter.patchInstanceGeometry(childId, brush1.geometry)

    // update attachment
    group.edges.geometry.setPositions(positions)
    group.setFaceGeometry(face1Brush.geometry)

    // update group matrix
    // let faceMatrix = new THREE.Matrix4()
    //     .copy(sectionChild.compoundMatrix)
    //     .multiply(
    //         new THREE.Matrix4().copy(sectionParent.compoundMatrix).invert()
    //     )
    //     .multiply(face1Brush.matrix)
    // group.setMatrix(faceMatrix)

    // group.setMatrix(sectionChild.compoundMatrix)
}

export function deleteSegment(line: SectionSegment) {
    const index = line.index
    const sectionCutter = drafter.sectionCutter
    const node = sectionCutter.nodeMap.get(index)
    if (!node) return

    sectionCutter.deleteSegment(index)
    node.attachments.segment = undefined

    const children = node.children as TransformNode[]

    for (let i = 0; i < children.length; i++) {
        drafter.detachNode(children[i])
    }

    drafter.pruneNode(node)
}
