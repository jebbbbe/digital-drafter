import * as THREE from "three"
import { LineSegments2 } from "three/addons/lines/LineSegments2.js"
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js"
import { matlib, orders, activeMaterialLib } from "../../draft/materialManager"
import type { LineMaterial } from "three/addons/lines/LineMaterial.js"

const selectedMaterial = matlib.sectionEdge.clone()
selectedMaterial.color.set("#e6e600")

export class SectionFaceGroup extends THREE.Group {
    face: THREE.Mesh
    edges: THREE.LineSegments | LineSegments2
    selectedMaterial: THREE.LineBasicMaterial | LineMaterial
    defaultMaterial: THREE.LineBasicMaterial | LineMaterial
    constructor(
        faceGeometry: THREE.BufferGeometry = new THREE.BufferGeometry()
    ) {
        super()

        this.face = new THREE.Mesh(faceGeometry, matlib.sectionFace)
        this.face.renderOrder = orders.sectionFace

        if (activeMaterialLib === "linewidth") {
            this.edges = new LineSegments2(
                new LineSegmentsGeometry(),
                matlib.sectionEdge
            )
        } else {
            this.edges = new THREE.LineSegments(
                new THREE.BufferGeometry(),
                matlib.sectionEdge
            )
        }
        this.edges.renderOrder = orders.sectionEdge

        this.defaultMaterial = matlib.sectionEdge
        this.selectedMaterial = selectedMaterial

        this.add(this.face)
        this.add(this.edges)
        this.matrixAutoUpdate = false
    }

    setEdgePositions(positions: number[] | Float32Array) {
        if (this.edges instanceof LineSegments2) {
            ;(this.edges.geometry as LineSegmentsGeometry).setPositions(
                positions
            )
            return
        }

        const geometry = this.edges.geometry
        const buffer =
            positions instanceof Float32Array
                ? positions
                : new Float32Array(positions)

        geometry.setAttribute("position", new THREE.BufferAttribute(buffer, 3))
        geometry.setDrawRange(0, buffer.length / 3)
        geometry.computeBoundingSphere()
        geometry.computeBoundingBox()
    }

    setFaceGeometry(faceGeometry: THREE.BufferGeometry) {
        this.face.geometry.dispose()
        this.face.geometry = faceGeometry
    }

    setMatrix(faceMatrix: THREE.Matrix4) {
        this.matrix.copy(faceMatrix)
        this.matrixWorldNeedsUpdate = true
    }
	
    setSelected(isSelected: boolean) {
        this.edges.material = isSelected
            ? this.selectedMaterial
            : this.defaultMaterial
    }

    dispose() {
        this.face.geometry.dispose()
        this.edges.geometry.dispose()
        this.removeFromParent()
    }
}
