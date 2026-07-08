import { SelectionObject } from "./SelectionObject"
import * as THREE from "three"
import type { Mesh } from "three"
import { deleteSegment } from "../controls/section"
import { drafter, controllers } from "../AppContext"
import { setupSegmentGizmo, moveSegmentToPosition } from "../controls/move"
import { deSelectAll } from "../controls/interaction"
import type { GizmoSettings } from "./ThreeControllersManager"
import { updatePanel } from "../../components/Leva/LevaStore"
import type { PanelSettings } from "../../components/Leva/LevaStore"

export type SectionSegment = {
    object: Mesh
    index: number
}

const _segmentMidPoint = new THREE.Vector3()
const _segmentDirection = new THREE.Vector3()
const _segmentQuaternion = new THREE.Quaternion()
const _segmentZAxis = new THREE.Vector3(0, 0, -1)
const _zeroVec3 = new THREE.Vector3()

export class SegmentSelectionObject extends SelectionObject<SectionSegment> {
    get kind(): "SectionSegment" {
        return "SectionSegment"
    }

    override move(_startHit: THREE.Vector3) {
        return undefined
    }

    override getCenter() {
        const line = this.target
        const [a, b] = drafter.sectionCutter.getSegmentAsVector(line.index)
        _segmentMidPoint.addVectors(a, b).multiplyScalar(0.5)
        return _segmentMidPoint
    }

    override gizmoSetup(settings: Partial<GizmoSettings>) {
        const line = this.target
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
        const line = this.target
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
        moveSegmentToPosition(this.target, position)
    }

    override delete() {
        deSelectAll()
        deleteSegment(this.target)
    }

    override setSelected(isSelected: boolean) {
        console.warn("not implemented Select for ", this)
    }
}
