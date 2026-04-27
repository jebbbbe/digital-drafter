import * as THREE from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"
import {
    ADDITION,
    SUBTRACTION,
    REVERSE_SUBTRACTION,
    INTERSECTION,
    DIFFERENCE,
    HOLLOW_SUBTRACTION,
    HOLLOW_INTERSECTION,
    Brush,
    Evaluator,
    Operation,
    OperationGroup,
} from "three-bvh-csg"

/*
CSGOperations

ADDITION              // A ∪ B
SUBTRACTION           // A - B
REVERSE_SUBTRACTION   // B - A
DIFFERENCE            // A ⊕ B
INTERSECTION          // A ∩ B

// "Hollow" operations are non-solid and result in simply removing the geometry
// within Brush B from brush A. For these operations Brush A can be non-manifold
// but it is still required that Brush B be a water-tight, two-manifold mesh.
HOLLOW_SUBTRACTION    // A - B
HOLLOW_INTERSECTION   // A ∩ B

*/

export function makeCustomMergeShape(): THREE.BufferGeometry {
    const geo1 = new THREE.BoxGeometry(1, 3, 1)
    const geo2 = new THREE.BoxGeometry(1, 1, 2)
    geo2.translate(1, 0, 0.5)
    geo1.rotateX(Math.PI / 4)
    const mergedGeometry = mergeGeometries([geo1, geo2])
    return mergedGeometry
}

export function makeCustomBVHShape(): THREE.BufferGeometry {
    const evaluator = new Evaluator()

    const geo1 = new THREE.BoxGeometry(1, 3, 1)
    geo1.rotateX(Math.PI / 4)
    const brush1 = new Brush(geo1)
    brush1.updateMatrixWorld()

    const geo2 = new THREE.BoxGeometry(1, 1, 2)
    geo2.translate(0.5, 0, 0.5)
    const brush2 = new Brush(geo2)
    brush2.updateMatrixWorld()

    // console.log({ geo1, brush1, geo2, brush2 })

    const result = evaluator.evaluate(brush1, brush2, ADDITION)
    // const result = evaluator.evaluate(brush1, brush2, SUBTRACTION)
    if (result) {
        // console.log(result)
        return result.geometry
    } else {
        return geo1
    }
}

export function makeCustomBVHHierarchyShape(): THREE.BufferGeometry {
    const evaluator = new Evaluator()

    const rootGeo = new THREE.BoxGeometry(2, 2, 2)
    const root = new Operation(rootGeo)
    const group = new OperationGroup()

    const cylinder = new Operation(new THREE.CylinderGeometry(0.4, 0.4, 3, 24))
    cylinder.rotation.z = Math.PI / 2
    cylinder.operation = ADDITION

    const sphere = new Operation(new THREE.SphereGeometry(0.75, 24, 16))
    sphere.position.set(0.6, 0.4, 0)
    sphere.operation = SUBTRACTION
    
    const cone = new Operation(new THREE.ConeGeometry(0.5, 1.5, 24))
    cone.position.set(-0.5, 0.8, 0)
    cone.rotation.z = Math.PI / 3
    cone.operation = ADDITION

    group.add(cylinder, sphere, cone)
    root.add(group)
    root.updateMatrixWorld(true)

    const result = evaluator.evaluateHierarchy(root)

    if (result) {
        return result.geometry
    } else {
        return rootGeo
    }
}
