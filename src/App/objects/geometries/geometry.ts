import * as THREE from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"
import { csgEvaluator } from "../../utils/csg"
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

const _defaultBox = new THREE.BoxGeometry(1, 1, 1)

export function makeCustomMergeShape(): THREE.BufferGeometry {
    const geo1 = new THREE.BoxGeometry(1, 3, 1)
    const geo2 = new THREE.BoxGeometry(1, 1, 2)
    geo2.translate(1, 0, 0.5)
    geo1.rotateX(Math.PI / 4)
    const mergedGeometry = mergeGeometries([geo1, geo2])
    return mergedGeometry
}

export function makeCustomBVHShape(): THREE.BufferGeometry {
    const geo1 = new THREE.BoxGeometry(1, 3, 1)
    geo1.rotateX(Math.PI / 4)
    const brush1 = new Brush(geo1)
    brush1.updateMatrixWorld()

    const geo2 = new THREE.BoxGeometry(1, 1, 2)
    geo2.translate(0.5, 0, 0.5)
    const brush2 = new Brush(geo2)
    brush2.updateMatrixWorld()

    // console.log({ geo1, brush1, geo2, brush2 })

    // const result = csgEvaluator.evaluate(brush1, brush2, ADDITION)
    const result = csgEvaluator.evaluate(brush1, brush2, SUBTRACTION)

    if (!result) return geo1
    return result.geometry
}

export function makeCustomBVHHierarchyShape(): THREE.BufferGeometry {
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

    const result = csgEvaluator.evaluateHierarchy(root)

    if (!result) return rootGeo
    return result.geometry
}

export function makeAsterisk(s = 10): THREE.BufferGeometry {
    const g1 = new THREE.BoxGeometry(s, 1, 1)
    const g2 = new THREE.BoxGeometry(1, s, 1)
    const g3 = new THREE.BoxGeometry(1, 1, s)
    const b1 = new Brush(g1)
    const b2 = new Brush(g2)
    const b3 = new Brush(g3)
    const s1 = csgEvaluator.evaluate(b1, b2, ADDITION)
    // asym test
    let result = csgEvaluator.evaluate(b3, s1, ADDITION)

    if (!result) return g1
    return result.geometry
}

export function makeAsteriskCenter(s = 10): THREE.BufferGeometry {
    let result = new Brush(makeAsterisk(s))

    const g4 = new THREE.BoxGeometry(s / 3, s / 3, s / 3)
    const b4 = new Brush(g4)
    b4.updateMatrixWorld(true)
    result = csgEvaluator.evaluate(result, b4, ADDITION)

    if (!result) return makeCube()
    return result.geometry
}

export function makeAsteriskAsym(s = 10): THREE.BufferGeometry {
    let result = new Brush(makeAsterisk(s))

    const g4 = new THREE.BoxGeometry(s / 3, s / 3, s / 3)
    const b4 = new Brush(g4)
    // b4.matrixAutoUpdate = false
    b4.position.x = s / 2
    b4.updateMatrixWorld(true)
    result = csgEvaluator.evaluate(result, b4, ADDITION)

    if (!result) return makeCube()
    return result.geometry
}

export function makeBadSphere(s = 0.5): THREE.BufferGeometry {
    const g1 = new THREE.BoxGeometry(s, s, 2)
    const g2 = new THREE.BoxGeometry(s, 2, s)
    const g3 = new THREE.BoxGeometry(2, s, s)
    const g4 = new THREE.SphereGeometry(1, 50)
    const b1 = new Brush(g1)
    const b2 = new Brush(g2)
    const b3 = new Brush(g3)
    const b4 = new Brush(g4)

    let result = csgEvaluator.evaluate(b4, b1, SUBTRACTION)
    result = csgEvaluator.evaluate(result, b2, SUBTRACTION)
    result = csgEvaluator.evaluate(result, b3, SUBTRACTION)

    if (!result) return g1
    return result.geometry
}

export function createWeirdSphereoid(iter = 1): THREE.BufferGeometry {
    const pos = [
        0, 1, 2, 3, 5, 6, 7, 8, 9, 11, 15, 17, 18, 19, 20, 21, 23, 24, 25, 26,
    ]
    let geo = _defaultBox.clone()
    let brush = new Brush(geo)
    const oneThird = 1 / 3

    for (let i = 0; i < iter; i++) {
        for (let j = 0; j < pos.length; j++) {
            const t = pos[j]
            const x = t % 3
            const y = Math.floor(t / 3) % 3
            const z = Math.floor(t / 9) % 3
            const tmp = brush.clone()
            tmp.position.copy(new THREE.Vector3(x, y, z))
            tmp.updateMatrixWorld()
            brush = csgEvaluator.evaluate(brush, tmp, ADDITION)
        }
        brush.scale.set(oneThird, oneThird, oneThird)
        brush.updateMatrixWorld()
    }
    brush.updateMatrixWorld()
    if (!brush) return geo
    return brush.geometry
}

export function createMengerSpongeGeometry(iter = 1): THREE.BufferGeometry {
    const keptCells = [
        0, 1, 2, 3, 5, 6, 7, 8, 9, 11, 15, 17, 18, 19, 20, 21, 23, 24, 25, 26,
    ]

    let cubes = [
        {
            center: new THREE.Vector3(0, 0, 0),
            size: 1,
        },
    ]

    for (let i = 0; i < iter; i++) {
        const nextCubes: Array<{ center: THREE.Vector3; size: number }> = []

        for (const cube of cubes) {
            const childSize = cube.size / 3

            for (const t of keptCells) {
                const x = (t % 3) - 1
                const y = (Math.floor(t / 3) % 3) - 1
                const z = (Math.floor(t / 9) % 3) - 1

                nextCubes.push({
                    center: cube.center
                        .clone()
                        .add(
                            new THREE.Vector3(
                                x * childSize,
                                y * childSize,
                                z * childSize
                            )
                        ),
                    size: childSize,
                })
            }
        }

        cubes = nextCubes
    }

    const geometries = cubes.map((cube) => {
        const geometry = new THREE.BoxGeometry(cube.size, cube.size, cube.size)
        geometry.translate(cube.center.x, cube.center.y, cube.center.z)
        return geometry
    })

    const geometry = mergeGeometries(geometries)

    if (!geometry) {
        return _defaultBox.clone()
    }
    return geometry
}

export function createMengerSpongeCSG(iter = 1): THREE.BufferGeometry {
    const keptCells = new Set([
        0, 1, 2, 3, 5, 6, 7, 8, 9, 11, 15, 17, 18, 19, 20, 21, 23, 24, 25, 26,
    ])

    const removedCells = Array.from({ length: 27 }, (_, t) => t).filter(
        (t) => !keptCells.has(t)
    )

    let cubes = [
        {
            center: new THREE.Vector3(0, 0, 0),
            size: 1,
        },
    ]

    const holeGeometries: THREE.BufferGeometry[] = []

    for (let i = 0; i < iter; i++) {
        const nextCubes: Array<{ center: THREE.Vector3; size: number }> = []

        for (const cube of cubes) {
            const childSize = cube.size / 3

            for (const t of removedCells) {
                const x = (t % 3) - 1
                const y = (Math.floor(t / 3) % 3) - 1
                const z = (Math.floor(t / 9) % 3) - 1
                const hole = new THREE.BoxGeometry(
                    childSize,
                    childSize,
                    childSize
                )

                hole.translate(
                    cube.center.x + x * childSize,
                    cube.center.y + y * childSize,
                    cube.center.z + z * childSize
                )
                holeGeometries.push(hole)
            }

            for (const t of keptCells) {
                const x = (t % 3) - 1
                const y = (Math.floor(t / 3) % 3) - 1
                const z = (Math.floor(t / 9) % 3) - 1

                nextCubes.push({
                    center: cube.center
                        .clone()
                        .add(
                            new THREE.Vector3(
                                x * childSize,
                                y * childSize,
                                z * childSize
                            )
                        ),
                    size: childSize,
                })
            }
        }

        cubes = nextCubes
    }

    if (holeGeometries.length === 0) {
        return _defaultBox.clone()
    }

    const holesGeometry = mergeGeometries(holeGeometries)
    if (!holesGeometry) {
        return _defaultBox.clone()
    }

    const rootBrush = new Brush(new THREE.BoxGeometry(1, 1, 1))
    const holesBrush = new Brush(holesGeometry)
    rootBrush.updateMatrixWorld()
    holesBrush.updateMatrixWorld()

    const result = csgEvaluator.evaluate(rootBrush, holesBrush, SUBTRACTION)
    if (!result) {
        return _defaultBox.clone()
    }
    return result.geometry
}

export function makeCube(x = 1, y = 1, z = 1) {
    return new THREE.BoxGeometry(x, y, z)
}

export function makeSphereGeometry(
    radius = 1,
    widthSegments = 32,
    heightSegments = 16
) {
    return new THREE.SphereGeometry(radius, widthSegments, heightSegments)
}

export function makeConeGeometry(
    radius = 1,
    height = 2,
    radiusSegments = 15,
    hightSegments = 1
) {
    return new THREE.ConeGeometry(radius, height, radiusSegments, hightSegments)
}

export function makeTorusGeometry(
    radius = 1,
    tube = 0.4,
    radialSegments = 12,
    tubularSegments = 48
) {
    return new THREE.TorusGeometry(
        radius,
        tube,
        radialSegments,
        tubularSegments
    )
}
