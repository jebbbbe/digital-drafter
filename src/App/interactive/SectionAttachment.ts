import * as THREE from "three"
import { LineSegments2 } from "three/addons/lines/LineSegments2.js"
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js"
import { Attachment } from "./InteractiveObject"
import { matlib, orders } from "../draft/materialManager"
import type { LineMaterial } from "three/addons/lines/LineMaterial.js"

const selectedMaterial = matlib.sectionEdge.clone()
selectedMaterial.color.set("#e6e600")

export class SectionAttachment extends THREE.Group implements Attachment {
    selected = false
    face: THREE.Mesh
    edges: LineSegments2
    selectedMaterial: LineMaterial
    defaultMaterial: LineMaterial
    constructor(
        faceGeometry: THREE.BufferGeometry = new THREE.BufferGeometry()
    ) {
        super()

        this.face = new THREE.Mesh(faceGeometry, matlib.sectionFace)
        this.face.renderOrder = orders.sectionFace

        this.edges = new LineSegments2(
            new LineSegmentsGeometry(),
            matlib.sectionEdge
        )
        this.edges.renderOrder = orders.sectionEdge

        this.defaultMaterial = matlib.sectionEdge
        this.selectedMaterial = selectedMaterial

        this.add(this.face)
        this.add(this.edges)
        this.matrixAutoUpdate = false
    }

    setSelected(isSelected: boolean) {
        this.selected = isSelected
        this.edges.material = isSelected
            ? this.selectedMaterial
            : this.defaultMaterial
    }

    delete() {
        this.face.geometry.dispose()
        this.edges.geometry.dispose()
        this.removeFromParent()
    }

    setEdgePositions(positions: number[] | Float32Array) {
        ;(this.edges.geometry as LineSegmentsGeometry).setPositions(positions)
    }

    setFaceGeometry(faceGeometry: THREE.BufferGeometry) {
        this.face.geometry.dispose()
        this.face.geometry = faceGeometry
    }

    setMatrix(faceMatrix: THREE.Matrix4) {
        this.matrix.copy(faceMatrix)
        this.matrixWorldNeedsUpdate = true
    }
}

export function createSectionAttachment() {
    return new SectionAttachment()
}
