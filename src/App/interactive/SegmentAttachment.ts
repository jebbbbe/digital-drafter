import * as THREE from "three"
import type { SectionCutter } from "../objects/attachments/SectionCutter"
import { InteractiveObject } from "./InteractiveObject"
import { drafter, controllers } from "../AppContext"
import type { GizmoSettings } from "../selection/ThreeControllersManager"
import type { PanelSettings } from "../../components/Leva/LevaStore"
import { updatePanel } from "../../components/Leva/LevaStore"
import { moveSegmentToPosition } from "../controls/move"
import { deSelectAll } from "../controls/interaction"
import { deleteSegment } from "../controls/section"

const _segmentMidPoint = new THREE.Vector3()
const _segmentDirection = new THREE.Vector3()
const _segmentQuaternion = new THREE.Quaternion()
const _segmentZAxis = new THREE.Vector3(0, 0, -1)
const _zeroVec3 = new THREE.Vector3()

export class SegmentAttachment extends InteractiveObject {
    object: SectionCutter
    index: number
    constructor(object: SectionCutter, index: number) {
        super()
        this.object = object
        this.index = index

        this.object.attachments[index] = this
    }

    override move(_startHit: THREE.Vector3) {
        return undefined
    }

    override getCenter() {
        const line = this
        const [a, b] = drafter.sectionCutter.getSegmentAsVector(line.index)
        _segmentMidPoint.addVectors(a, b).multiplyScalar(0.5)
        return _segmentMidPoint
    }

    override gizmoSetup(settings: Partial<GizmoSettings>) {
        const line = this
        const [a, b] = drafter.sectionCutter.getSegmentAsVector(line.index)
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
        const [a, b] = drafter.sectionCutter.getSegmentAsVector(line.index)
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

    override gizmoListener(position = controllers.getGizmoPosition()) {
        moveSegmentToPosition(this, position)
    }

    override delete() {
        deSelectAll()
        deleteSegment(this)
    }

    override setSelected(isSelected: boolean) {
        console.warn("not implemented Select for ", this)
    }
}

export function createSegmentAttachment(
    object: SectionCutter,
    index: number
): SegmentAttachment {
    return new SegmentAttachment(object, index)
}
