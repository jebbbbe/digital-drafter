import * as THREE from "three"
import {
    Brush,
    Evaluator,
    ADDITION,
    SUBTRACTION,
    REVERSE_SUBTRACTION,
    INTERSECTION,
    DIFFERENCE,
    HOLLOW_SUBTRACTION,
    HOLLOW_INTERSECTION,
    Operation,
    OperationGroup,
} from "three-bvh-csg"
import type { CSGOperation } from "three-bvh-csg"
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
*/

export const boolean = {
    union: ADDITION,
    difference: SUBTRACTION,
    differenceOther: REVERSE_SUBTRACTION,
    intersection: INTERSECTION,
} as const

const evaluator = new Evaluator()

export function evaluateCSG(
    A: Brush,
    B: Brush,
    operation: CSGOperation = boolean.difference,
    result: Brush = new Brush()
): Brush {
    evaluator.evaluate(A, B, operation, result)
    return result
}
