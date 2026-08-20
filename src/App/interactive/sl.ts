import * as THREE from "three"
import type { GizmoSettings, PanelSettings } from "@types"
import { InteractiveObject } from "./InteractiveObject"
import { matlib, orders } from "../draft/materialManager"
import { InstancedNodeSegments2 } from "../objects/meshes"
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js"
import { scene } from "../AppContext"

import { InstancedLineMaterial } from "../objects/materials"
import { InstancedLineSegments2 } from "../objects/meshes"

// const points = [-1, 0, 0, 1, 0, 0]
const points = [-1, 0, -1, -1, 0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, -1]
// const colors = [1, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0]

export class NEWSectionCutter {
    size = 128
    // material = matlib.sectionLine
    material = new InstancedLineMaterial({
        // color: "#000000",
        color: 0xffffff,
        opacity: 1.0,
        transparent: false,
        linewidth: 1.15 * Math.random() * 5 + 0.35,

        dashed: false,
        dashSize: 0.05,
        gapSize: 0.01,

        depthTest: true,
        depthWrite: false,

        // vertexColors: true,
    })
    geometry = new LineSegmentsGeometry().setPositions(points) //.setColors(colors)
    mesh = new InstancedLineSegments2(this.geometry, this.material, this.size)
    constructor(scene: THREE.Scene) {
        this.mesh.count = 1
        this.mesh.position.y = 4
        this.mesh.frustumCulled = false
        this.mesh.renderOrder = orders.sectionLine

        scene.add(this.mesh)
        console.log("NEWSectionCutter")
        const a = this.getMatrix(0)
        this.addInstance(new THREE.Vector3(0, 0, 3))
        this.addInstance(new THREE.Vector3(0, 0, 6))
        this.addInstance(new THREE.Vector3(0, 0, 9))
        const b = this.getMatrix(1)
        console.log(a)
        console.log(b)

        this.mesh.setColorAt(0, new THREE.Color(0x000000))
        this.mesh.setColorAt(1, new THREE.Color(0xeeeeee))
        this.mesh.setColorAt(2, new THREE.Color(0x00ff00))
        this.mesh.setColorAt(3, new THREE.Color(0xffffff))
    }
    resize(minSize = this.size * 2) {
        this.size = minSize
    }

    getMatrix(index: number) {
        const matrix = new THREE.Matrix4()
        this.mesh.getMatrixAt(index, matrix)
        return matrix
    }

    addInstance(origin: THREE.Vector3) {
        const index = this.mesh.count
        this.mesh.setMatrixAt(
            index,
            new THREE.Matrix4().makeTranslation(origin.x, origin.y, origin.z)
        )
        this.mesh.count += 1
        this.mesh.instanceMatrix.needsUpdate = true
    }

    markUpdate() {}
    getSegmentAsVector() {}
    addSegmentVector() {}
    patchSegmentVector() {}
    patchSegmentArray() {}
    moveSegmentVector() {}
    deleteSegment() {}
}

// const sectionCutter = new SectionCutter(scene)

// export class SegmentAttachment extends InteractiveObject {}
/*
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
        const [a, b] = sectionCutter.getSegmentAsVector(line.index)
        _segmentMidPoint.addVectors(a, b).multiplyScalar(0.5)
        return _segmentMidPoint
    }

    override gizmoSetup(settings: Partial<GizmoSettings>) {
        const line = this
        const [a, b] = sectionCutter.getSegmentAsVector(line.index)
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
        const [a, b] = sectionCutter.getSegmentAsVector(line.index)
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
    }

    override delete() {
        deleteSegment(this)
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
	*/

/*

	could mock this class with instance and singleton...
	all logic in singleton. only use this as way to cache ID...?

class B implements InteractiveObject {
	id: number
	constructor(id: number) {
		this.object = instancedObject
		this.id = id
	}
	delete(): void{
		this.object.delete(this.id)
	}
	
	setSelected(isSelected: boolean): void{
		this.object.setSelected(this.id)
	}
	
	move(startHit: THREE.Vector3): unknown{
		return this.object.move(this.id)
	}
	
	getCenter(): THREE.Vector3{
		return this.object.getCenter(this.id)
	}
	
	gizmoSetup(override: Partial<GizmoSettings>): void{
		this.object.gizmoSetup(this.id)
	}
	
	panelSetup(override: Partial<PanelSettings>): void{
		this.object.panelSetup(this.id)
	}
	
	gizmoListener(position?: THREE.Vector3): void{
		this.object.gizmoListener(this.id)
	}
}
	*/
