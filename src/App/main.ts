import * as THREE from "three"
import { constants } from "./constants"
import * as shape from "./objects/geometries/geometry"
import { OrbitControls } from "three/examples/jsm/Addons.js"
import Stats from "three/examples/jsm/libs/stats.module.js"
import { AspectLayout } from "./utils/AspectLayout"
import { loadGlb } from "./utils/loader"
import { InteractionManager } from "./interaction/InteractionManager"
import { Drafter } from "./draft/Drafter"
import * as rand from "./utils/random"
import type { TransformNode } from "./draft/TransformNode"
import type { NodeLocation } from "./draft/TransformTree"
// import { createBvhBooleanTest, type BvhBooleanTest } from "./test/bvhBooleanTest"
import { geometryLibrary } from "./objects/geometries/library"

let isAppReady = false
let statsEnabled = false

const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({
        color: "#1d8bff",
        roughness: 0.35,
        metalness: 0.08,
    })
)
let renderer!: THREE.WebGLRenderer
let scene!: THREE.Scene
let camera!: THREE.OrthographicCamera
let orbitControls!: OrbitControls
let layout!: AspectLayout
let frameId = 0
let stats: Stats | undefined

let interactionManager!: InteractionManager
let drafter!: Drafter
// let bvhBooleanTest: BvhBooleanTest | undefined

let testNode: any
let testNodeVelocityX = 0.001

function syncStatsVisibility(): void {
    if (!stats) return
    stats.dom.style.display = statsEnabled ? "" : "none"
}

export function setStatsEnabled(value: boolean): void {
    statsEnabled = value
    syncStatsVisibility()
}

export function init(container: HTMLElement): () => void {
    // const assetsLoader = loadAssets()x

    if (import.meta.env.DEV) {
        console.log("DEV")
    }

    dispose()

    //layout
    layout = new AspectLayout("dynamic", container)

    // renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
    })
    renderer.setSize(layout.x, layout.y)
    renderer.setPixelRatio(globalThis.devicePixelRatio)
    container.appendChild(renderer.domElement)

    stats = new Stats()
    container.appendChild(stats.dom)
    syncStatsVisibility()

    // scene
    scene = new THREE.Scene()
    scene.background = new THREE.Color(
        constants.themes.objects[constants.theme].display.background
    )

    //camera
    camera = new THREE.OrthographicCamera(...layout.getThreeOrthographicArgs())
    camera.zoom = constants.camera.zoom
    camera.position.set(...constants.camera.position)
    camera.lookAt(0, 0, 0)

    //orbitControls
    orbitControls = initOrbit(camera, renderer)

    // content
    // const ambient = new THREE.AmbientLight(0xffffff, 0.7)
    // const sun = new THREE.DirectionalLight(0xffffff, 0.9)
    // sun.position.set(2, 3, 4)
    // scene.add(ambient, sun)

    const gridHelper = new THREE.GridHelper()
    const axesHelper = new THREE.AxesHelper(10)
    axesHelper.renderOrder = 1
    // scene.add(gridHelper, axesHelper)

    // Drafter
    drafter = new Drafter(scene)

    const r = Math.random()
    if (r < 1 / 3) {
        // prettier-ignore
        drafter.newInstance(geometryLibrary.custom)
        drafter.newInstance(geometryLibrary.asterix)
        drafter.newInstance(geometryLibrary.asterixBox)
    } else if (r < 2 / 3) {
        // prettier-ignore
        drafter.newInstance(geometryLibrary.asterix)
        drafter.newInstance(geometryLibrary.asterixBox)
        drafter.newInstance(geometryLibrary.custom)
    } else {
        drafter.newInstance(geometryLibrary.asterixBox)
        drafter.newInstance(geometryLibrary.custom)
        drafter.newInstance(geometryLibrary.asterix)
    }

    const scale = 1 // rand.random(0.75, 1.5)
    const initalTransform = new THREE.Matrix4()
        .makeRotationX(
            rand.randomItem([0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2])
            // rand.random(0, Math.PI * 2)
        )
        .scale(new THREE.Vector3(scale, scale, scale))

    const initalTrees: Array<{
        root: Partial<TransformNode>
        leafs: Array<{ node: Partial<TransformNode>; parent: NodeLocation }>
    }> = [
        {
            root: {
                position: new THREE.Vector3(0, 0, 0),
                location: { id: 0, index: -1 },
                baseMatrix: initalTransform.clone(),
            },
            // prettier-ignore
            leafs: [
                // { node:{position: new THREE.Vector3(2, 0, 2),  type:"mirror" }, parent:{ id:0, index: 0 }}, mirror nodde test
                { node:{position: new THREE.Vector3(2, 0, 2),   }, parent:{ id:0, index: 0 }},
                { node:{position: new THREE.Vector3(2, 0, 0),   }, parent:{ id:0, index: 1 }},
                { node:{position: new THREE.Vector3(2, 0, -2),  }, parent:{ id:0, index: 2 }},
                { node:{position: new THREE.Vector3(-2, 0, -2), }, parent:{ id:0, index: 0 }},
                { node:{position: new THREE.Vector3(-2, 0, 2),  }, parent:{ id:0, index: 0 }},
                { node:{position: new THREE.Vector3(4, 0, 0),  }, parent:{ id:0, index: 2 }},
                { node:{position: new THREE.Vector3(-4, 0, 0), }, parent:{ id:0, index: 0 }},
                { node:{position: new THREE.Vector3(-4, 0, 2), }, parent:{ id:0, index: 5 }},
                { node:{position: new THREE.Vector3(-4, 0, -2), }, parent:{ id:0, index: 4 }},
            ],
        },
        {
            root: {
                position: new THREE.Vector3(4, 0, 4),
                location: { id: 0, index: -1 },
                baseMatrix: initalTransform.clone(),
            },
            // prettier-ignore
            leafs: [],
        },
        {
            root: {
                position: new THREE.Vector3(-4, 0, 4),
                location: { id: 0, index: -1 },
                baseMatrix: initalTransform.clone(),
            },
            // prettier-ignore
            leafs: [],
        },

        {
            root: {
                position: new THREE.Vector3(4, 0, -4),
                location: { id: 1, index: -1 },
                baseMatrix: initalTransform.clone(),
            },
            // prettier-ignore
            leafs: [
                { node:{position: new THREE.Vector3(6, 0, -4),   }, parent:{ id:1, index: 0 }},
                { node:{position: new THREE.Vector3(6, 0, -2),   }, parent:{ id:1, index: 1 }},
                { node:{position: new THREE.Vector3(8, 0, -2),   }, parent:{ id:1, index: 2 }},
                { node:{position: new THREE.Vector3(6, 0, 0),   }, parent:{ id:1, index: 3 }},
                { node:{position: new THREE.Vector3(6, 0, 2),   }, parent:{ id:1, index: 4 }},
                { node:{position: new THREE.Vector3(8, 0, 0),   }, parent:{ id:1, index: 2 }},
                { node:{position: new THREE.Vector3(8, 0, 2),   }, parent:{ id:1, index: 6 }},
                { node:{position: new THREE.Vector3(8, 0, -4),   }, parent:{ id:1, index: 3 }},
            ],
        },
        {
            root: {
                position: new THREE.Vector3(-4, 0, -4),
                location: { id: 1, index: -1 },
                baseMatrix: new THREE.Matrix4(),
            },
            // prettier-ignore
            leafs: [],
        },
        {
            root: {
                position: new THREE.Vector3(-6, 0, -4),
                location: { id: 2, index: -1 },
                baseMatrix: initalTransform.clone(),
            },
            // prettier-ignore
            leafs: [
                { node:{position: new THREE.Vector3(-6, 0, -2),   }, parent:{ id:2, index: 0 }},
                { node:{position: new THREE.Vector3(-8, 0, -2),   }, parent:{ id:2, index: 1 }},
                { node:{position: new THREE.Vector3(-6, 0, 0),   }, parent:{ id:2, index: 2 }},
                { node:{position: new THREE.Vector3(-6, 0, 2),   }, parent:{ id:2, index: 3 }},
                { node:{position: new THREE.Vector3(-8, 0, 0),   }, parent:{ id:2, index: 1 }},
                { node:{position: new THREE.Vector3(-8, 0, 2),   }, parent:{ id:2, index: 5 }},
                { node:{position: new THREE.Vector3(-8, 0, -4),   }, parent:{ id:2, index: 2 }},
            ],
        },
    ]

    function addTrees(drafter: Drafter, trees: any) {
        for (let i = 0; i < trees.length; i++) {
            const tree = trees[i].root
            drafter.addRootNode(tree)
            const leafs = trees[i].leafs
            for (let i = 0; i < leafs.length; i++) {
                const leaf = leafs[i]
                drafter.addLeafNode(leaf.node, leaf.parent)
            }
        }
    }
    addTrees(drafter, initalTrees)
    ;(globalThis as any).drafter = drafter

    testNode = drafter.findNode({ id: 0, index: 2 })

    // const [loadedCubeModel] = await assetsLoader
    // if (!loadedCubeModel) {
    //     throw new Error('Failed to resolve asset "/cube.glb"')
    // }
    // scene.add(loadedCubeModel)

    interactionManager = new InteractionManager({
        camera,
        scene,
        domElement: renderer.domElement,
        orbitControls,
        drafter,
    })
    interactionManager.addEventListeners()

    layout.addResizeListener(renderer, camera, render)

    frameId = globalThis.requestAnimationFrame(animate)

    isAppReady = true
    return dispose
}

function render(): void {
    if (statsEnabled) {
        stats?.update()
    }
    orbitControls.update()
    // bvhBooleanTest?.update(globalThis.performance.now() * 0.001)
    renderer.render(scene, camera)
    if (testNode && false) {
        testNode.position.x += testNodeVelocityX
        if (testNode.position.x >= 2.75 || testNode.position.x <= 1.25) {
            testNodeVelocityX *= -1
        }
        drafter.updatePatchedNode(testNode)
    }
}

function animate(): void {
    render()
    frameId = globalThis.requestAnimationFrame(animate)
}

function dispose(): void {
    isAppReady = false

    if (!renderer) {
        return
    }
    globalThis.cancelAnimationFrame(frameId)
    layout.removeResizeListener()
    interactionManager.dispose()
    stats?.dom.remove()
    stats = undefined
    renderer.dispose()
    renderer.domElement.remove()
}

function initOrbit(
    camera: THREE.OrthographicCamera,
    renderer: THREE.WebGLRenderer
) {
    orbitControls = new OrbitControls(camera, renderer.domElement)
    orbitControls.enableDamping = true // an animation loop is required when either damping or auto-rotation are enabled
    orbitControls.dampingFactor = 0.15 //0.05
    orbitControls.screenSpacePanning = false
    orbitControls.enablePan = true
    orbitControls.enableRotate = false
    orbitControls.mouseButtons.LEFT = THREE.MOUSE.PAN
    orbitControls.mouseButtons.RIGHT = THREE.MOUSE.PAN
    orbitControls.touches.ONE = THREE.TOUCH.PAN
    orbitControls.touches.TWO = THREE.TOUCH.DOLLY_PAN
    orbitControls.minDistance = 1 //zoom min scaling
    orbitControls.maxDistance = 2000 //zoom max scaling
    orbitControls.minZoom = 0.006
    orbitControls.maxZoom = 0.4
    orbitControls.update()
    // orbitControls.addEventListener("change", () => { // for no aniumation loop()
    // renderer.render(scene, camera);
    // });
    return orbitControls
}

export {
    isAppReady,
    renderer,
    scene,
    camera,
    orbitControls,
    cube,
    drafter,
    interactionManager,
}

function loadAssets(): Promise<[THREE.Object3D]> {
    return Promise.all([loadGlb("/cube.glb")])
}
