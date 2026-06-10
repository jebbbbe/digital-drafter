import * as THREE from "three"
import { MultiInstanceLineSegmentsGeometry } from "../materials/MultiInstanceLineSegmentsGeometry"
import { MultiInstanceLineMaterial } from "../materials/MultiInstanceLineMaterial"

export class MultiInstanceLineSegments extends THREE.InstancedMesh {
    declare geometry: MultiInstanceLineSegmentsGeometry
    declare material: MultiInstanceLineMaterial

    constructor(
        geometry: MultiInstanceLineSegmentsGeometry = new MultiInstanceLineSegmentsGeometry(),
        material: MultiInstanceLineMaterial = new MultiInstanceLineMaterial(),
        count: number
    ) {
        super(geometry, material, count)

        //@ts-ignore
        this.isMultiInstanceLineSegments = true
        ;(this as any).type = "MultiInstanceLineSegments"

        this.syncGeometryUniforms()
    }

    syncGeometryUniforms() {
        this.material.setSegments(this.geometry.segmentPoints)
        this.material.setSegmentColors(this.geometry.segmentColors)
        this.material.setSegmentDistances(this.geometry.segmentDistances)

        return this
    }
}
