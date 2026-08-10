import * as THREE from "three"
import { drafter } from "../AppContext"
import {
    createSectionAttachment,
    createSegmentAttachment,
} from "../interactive"
import type { SegmentAttachment, TransformNode } from "@types"
import * as rand from "../utils/random"
import { evaluateCSG, boolean, csgEvaluator } from "../utils/csg"
import type { InstanceItem } from "../draft/InstanceItem"
import { SectionFaceGroup } from "../interactive"

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

function csgFromParent(
    start: THREE.Vector3,
    end: THREE.Vector3,
    instanceItem: InstanceItem,
    sectionParent: TransformNode
) {
    const instanceBrush = instanceItem.brush
    const prevMatrix = instanceBrush.matrix.clone()

    _midPoint.addVectors(start, end).multiplyScalar(0.5)

    instanceBrush.matrix.copy(sectionParent.compoundMatrix)
    instanceBrush.updateMatrixWorld(true)

    _dir2.subVectors(end, _midPoint).setY(0).normalize()
    let angle = Math.atan2(_dir2.x, _dir2.z)
    if (angle < 0) angle += Math.PI * 2

    const size = 50
    _move1.makeTranslation(0.5, 0, 0)
    _scale.makeScale(size, size, size)
    _rotate.makeRotationY(angle)
    _move2.makeTranslation(_midPoint)
    const boxBrush = drafter.sectionCutter.brush
    boxBrush.matrix.identity()
    boxBrush.matrix
        .copy(_move2)
        .multiply(_rotate)
        .multiply(_scale)
        .multiply(_move1)
    boxBrush.updateMatrixWorld(true)

    if (drafter.debug.enable) {
        drafter.debug.objects.section.matrix.copy(boxBrush.matrix)
    }

    try {
        const brush1 = evaluateCSG(
            instanceBrush,
            boxBrush,
            boolean.intersection
        )
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

export function createNewCutNode(sectionParent: TransformNode) {
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

    _offset.set(0, 0, rand.random(-0.25, 0.25))
    const t = rand.random(0, Math.PI * 2)
    const lineLen = s * 1.0
    _start.set(lineLen, 0, 0)
    _end.set(-lineLen, 0, 0)

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
    const id = sectionParent.location.id
    const instanceItem = drafter.getInstance(id)

    const sectionFace = new SectionFaceGroup()
    const cutResult = csgFromParent(_start, _end, instanceItem, sectionParent)
    if (!cutResult) {
        sectionFace.dispose()
        return
    }
    const { brush1, face1Brush, positions } = cutResult
    sectionFace.setEdgePositions(positions)
    sectionFace.setFaceGeometry(face1Brush.geometry)

    // add instance
    const side1ID = drafter.instanceItems.nextIndex()
    drafter.newInstance(brush1.geometry)

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
        location: { id: side1ID, index: -1 },
        parent: sectionParent,
        sectionChild: true,
    }

    // add new root!
    const sectionChild = drafter.addLeafNode(side1Root)
    if (!sectionChild) {
        sectionFace.dispose()
        return
    }

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
    let faceMatrix = new THREE.Matrix4()
        .copy(sectionChild.compoundMatrix)
        .multiply(
            new THREE.Matrix4().copy(sectionParent.compoundMatrix).invert()
        )
        .multiply(face1Brush.matrix)

    sectionFace.setMatrix(faceMatrix)

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
    const instanceItem = drafter.getInstance(parentId)

    const attachment = sectionChild.attachments.section
    if (!attachment) return

    const group = attachment.object

    const cutResult = csgFromParent(start, end, instanceItem, sectionParent)
    if (!cutResult) return
    const { brush1, face1Brush, positions } = cutResult
    group.setEdgePositions(positions)

    drafter.patchInstanceGeometry(childId, brush1.geometry)

    group.setFaceGeometry(face1Brush.geometry)

    // matrix
    let faceMatrix = new THREE.Matrix4()
        .copy(sectionChild.compoundMatrix)
        .multiply(
            new THREE.Matrix4().copy(sectionParent.compoundMatrix).invert()
        )
        .multiply(face1Brush.matrix)
    group.setMatrix(faceMatrix)
}

export function deleteSegment(line: SegmentAttachment) {
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

    drafter.spliceNode(node)
}
