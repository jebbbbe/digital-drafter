import * as THREE from "three"
import { LineSegments2 } from "three/addons/lines/LineSegments2.js"
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js"
import { matlib, orders } from "../../draft/materialManager"

export class SectionFaceGroup extends THREE.Group {
    face: THREE.Mesh
    edges: LineSegments2

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

        this.add(this.face)
        this.add(this.edges)
        this.matrixAutoUpdate = false
    }

    setFaceGeometry(faceGeometry: THREE.BufferGeometry) {
        this.face.geometry.dispose()
        this.face.geometry = faceGeometry
    }

    setMatrix(faceMatrix: THREE.Matrix4) {
        this.matrix.copy(faceMatrix)
        this.matrixWorldNeedsUpdate = true
    }

    dispose() {
        this.face.geometry.dispose()
        this.edges.geometry.dispose()
        this.removeFromParent()
    }
}
