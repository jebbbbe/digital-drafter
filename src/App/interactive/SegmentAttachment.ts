import * as THREE from "three"
import { InteractiveObject } from "./InteractiveObject"
import { drafter, controllers } from "../AppContext"
import type {
    GizmoSettings,
    PanelSettings,
    SectionCutter,
    TransformNode,
} from "@types"
import { updatePanel } from "../../components/Leva/LevaStore"

const _segmentMidPoint = new THREE.Vector3()
const _segmentDirection = new THREE.Vector3()
const _segmentQuaternion = new THREE.Quaternion()
const _segmentZAxis = new THREE.Vector3(0, 0, -1)
const _zeroVec3 = new THREE.Vector3()
const _delta = new THREE.Vector3()
const _segmentLineDirection = new THREE.Vector3()

export class SegmentAttachment extends InteractiveObject {
    sectionCutter: SectionCutter
    index: number
    constructor(sectionCutter: SectionCutter, index: number) {
        super()
        this.sectionCutter = sectionCutter
        this.index = index

        this.sectionCutter.attachments[index] = this
    }

    override move(_startHit: THREE.Vector3) {
        return undefined
    }

    override getCenter() {
        const line = this
        const [a, b] = this.sectionCutter.getSegmentAsVector(line.index)
        _segmentMidPoint.addVectors(a, b).multiplyScalar(0.5)
        return _segmentMidPoint
    }

    override gizmoSetup(settings: Partial<GizmoSettings>) {
        const line = this
        const [a, b] = this.sectionCutter.getSegmentAsVector(line.index)
        _segmentMidPoint.addVectors(a, b).multiplyScalar(0.5)
        _segmentDirection.subVectors(b, a)
        if (_segmentDirection.lengthSq() === 0) {
            _segmentQuaternion.identity()
        } else {
            _segmentQuaternion.setFromUnitVectors(
                _segmentZAxis,
                _segmentDirection.normalize()
            )
        }

        const defaultGizmo: GizmoSettings = {
            anchor: _zeroVec3,
            center: _segmentMidPoint,
            quaternion: _segmentQuaternion,
            preset: "translate1d",
        }
        settings = { ...defaultGizmo, ...settings }
        controllers.setGizmoSettings(settings as GizmoSettings)
    }

    override panelSetup(settings: Partial<PanelSettings>) {
        const line = this
        const [a, b] = this.sectionCutter.getSegmentAsVector(line.index)
        _segmentMidPoint.addVectors(a, b).multiplyScalar(0.5)

        const defaultPanel = {
            position: _segmentMidPoint,
            rotation: { x: 0, y: 0 },
            scale: 1.0,
            usePosition: true, //should update vals but be unusable...
            useRotation: false,
            useScale: false,
            useButtons: false,
        }
        settings = { ...defaultPanel, ...settings }
        console.log(settings)
        updatePanel(settings as PanelSettings)
    }

    override gizmoListener(nextPosition = controllers.getGizmoPosition()) {
        const index = this.index
        const sectionChild = this.sectionCutter.nodeMap.get(index)
        if (sectionChild === undefined) return false

        const sectionParent = sectionChild.parent
        if (sectionParent === undefined) return false

        _segmentLineDirection.subVectors(
            sectionChild.position,
            sectionParent.position
        )
        const lineLengthSq = _segmentLineDirection.lengthSq()
        if (lineLengthSq === 0) return false

        const [a, b] = this.sectionCutter.getSegmentAsVector(index)
        _segmentMidPoint.addVectors(a, b).multiplyScalar(0.5)
        _delta.subVectors(nextPosition, _segmentMidPoint)

        const deltaAlongLine = _delta.dot(_segmentLineDirection) / lineLengthSq
        _delta.copy(_segmentLineDirection).multiplyScalar(deltaAlongLine)
        if (_delta.lengthSq() === 0) return false

        this.sectionCutter.moveSegmentVector(_delta, _delta, index)

        const [nextA, nextB] = this.sectionCutter.getSegmentAsVector(index)
        drafter.updatePatchedNode(sectionChild)
        _segmentMidPoint.addVectors(nextA, nextB).multiplyScalar(0.5)
        controllers.updateGizmoPosition(_segmentMidPoint)

        return true
    }

    override delete() {
        const index = this.index
        const node = this.sectionCutter.nodeMap.get(index)
        if (!node) return

        this.sectionCutter.deleteSegment(index)
        node.attachments.segment = undefined

        const children = node.children as TransformNode[]

        for (let i = 0; i < children.length; i++) {
            drafter.detachNode(children[i])
        }

        drafter.spliceNode(node)
    }

    override setSelected(isSelected: boolean) {
        this.selected = isSelected
        console.warn("not implemented Select for ", this)
    }
}

export function createSegmentAttachment(
    object: SectionCutter,
    index: number
): SegmentAttachment {
    return new SegmentAttachment(object, index)
}
