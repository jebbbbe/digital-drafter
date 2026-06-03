import * as THREE from "three"
import { LineSegments2 } from "three/addons/lines/LineSegments2.js"
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js"
import { matlib, orders } from "../../draft/materialManager"

type DisposableObject3D = THREE.Object3D & {
    geometry?: THREE.BufferGeometry
}

export class SectionFaceGroup extends THREE.Group {
    edges: LineSegments2

    constructor() {
        super()

        this.edges = new LineSegments2(
            new LineSegmentsGeometry(),
            matlib.sectionEdge
        )
        this.edges.renderOrder = orders.sectionEdge
        matlib.sectionEdge.resolution.set(window.innerWidth, window.innerHeight)
        this.edges.onBeforeRender = () => {
            matlib.sectionEdge.resolution.set(
                window.innerWidth,
                window.innerHeight
            )
        }

        this.add(this.edges)
        this.matrixAutoUpdate = false
    }

    setMatrix(faceMatrix: THREE.Matrix4) {
        this.matrix.copy(faceMatrix)
        this.matrixWorldNeedsUpdate = true
    }

    dispose() {
        this.traverse((object) => {
            const disposableObject = object as DisposableObject3D
            disposableObject.geometry?.dispose()
        })
        this.removeFromParent()
    }
}
