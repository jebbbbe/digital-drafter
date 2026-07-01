import * as THREE from "three"
import { constants } from "./constants"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { AspectLayout } from "./utils/AspectLayout"
import { loadGlb } from "./utils/loader"
import { Drafter } from "./draft/Drafter"
import * as rand from "./utils/random"
import type { TransformNode } from "./draft/TransformNode"
import type { NodeLocation } from "./draft/TransformTree"
import { geometryLibrary } from "./objects/geometries/library"
import { createNewCutNode } from "./controls/section"
import { StatsPanel } from "./test/StatsPanel"
import { RaycastHelper } from "./interaction/RaycastHelper"
import { SelectionManager } from "./interaction/selectionManager"
import { TransformControls } from "three/examples/jsm/Addons.js"
import { ThreeControllersManager } from "./interaction/controllers"

let isAppReady = false

let renderer!: THREE.WebGLRenderer
let scene!: THREE.Scene
let camera!: THREE.OrthographicCamera
let orbitControls!: OrbitControls
let layout!: AspectLayout
let frameId = 0
let statsPanel: StatsPanel

let drafter!: Drafter
let raycastHelper!: RaycastHelper
let selection!: SelectionManager
let controllers!: ThreeControllersManager

export function init(container: HTMLElement): () => void {
    // const assetsLoader = loadAssets()x

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

    statsPanel = new StatsPanel(document.body, import.meta.env.DEV)

    // scene
    scene = new THREE.Scene()
    scene.background = new THREE.Color(
        constants.themes[constants.theme].display.background
    )

    //camera
    camera = new THREE.OrthographicCamera(...layout.getThreeOrthographicArgs())
    camera.zoom = constants.camera.zoom
    camera.position.set(...constants.camera.position)
    camera.lookAt(0, 0, 0)

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

    const geometryItems = Object.values(geometryLibrary) as [
        THREE.BufferGeometry,
        ...THREE.BufferGeometry[],
    ]
    geometryItems.pop()
    for (let i = 0; i < 3; i++) {
        drafter.newInstance(rand.randomItem(geometryItems))
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
                { node:{position: new THREE.Vector3(2, 0, 2),   }, parent:{ id:0, index: 0 }},
                { node:{position: new THREE.Vector3(2, 0, 0),   }, parent:{ id:0, index: 1 }},
                { node:{position: new THREE.Vector3(2, 0, -2),  }, parent:{ id:0, index: 2 }},
                { node:{position: new THREE.Vector3(-2, 0, -2), }, parent:{ id:0, index: 0 }},
                { node:{position: new THREE.Vector3(-2, 0, 2),  }, parent:{ id:0, index: 0 }},
                { node:{position: new THREE.Vector3(4, 0, 0),  }, parent:{ id:0, index: 2 }},
                { node:{position: new THREE.Vector3(-4, 0, 0), }, parent:{ id:0, index: 0 }},
                { node:{position: new THREE.Vector3(-4, 0, 2), }, parent:{ id:0, index: 5 }},
                { node:{position: new THREE.Vector3(-4, 0, -2), }, parent:{ id:0, index: 4 }},
                { node:{position: new THREE.Vector3(1.7, 0, -2.05), }, parent:{ id:0, index: 0}},
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

    // Secction Cut Node Tests
    let nodeToCut
    nodeToCut = drafter.findNode({ id: 0, index: 4 })
    if (nodeToCut) createNewCutNode(nodeToCut)
    nodeToCut = drafter.findNode({ id: 0, index: 6 })
    if (nodeToCut) createNewCutNode(nodeToCut)
    nodeToCut = drafter.findNode({ id: 1, index: 4 })
    if (nodeToCut) createNewCutNode(nodeToCut)
    nodeToCut = drafter.findNode({ id: 2, index: 5 })
    if (nodeToCut) createNewCutNode(nodeToCut)

    // raycaster
    raycastHelper = new RaycastHelper(
        camera,
        drafter.interactiveObjects,
        renderer.domElement
    )
    // selectionManager
    selection = new SelectionManager()

    // controllers
    orbitControls = initOrbit(camera, renderer)
    const transformControls = new TransformControls(camera, renderer.domElement)
    controllers = new ThreeControllersManager(
        selection,
        orbitControls,
        transformControls,
        true
    )
    scene.add(controllers.transformProxy)
    scene.add(transformControls.getHelper())

    // async
    // const [loadedCubeModel] = await assetsLoader
    // if (!loadedCubeModel) {
    //     throw new Error('Failed to resolve asset "/cube.glb"')
    // }
    // scene.add(loadedCubeModel)

    layout.addResizeListener(renderer, camera, render)

    frameId = globalThis.requestAnimationFrame(animate)

    isAppReady = true
    return dispose
}

function render(): void {
    statsPanel.update()
    orbitControls.update()
    renderer.render(scene, camera)
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
    controllers.dispose()
    statsPanel.dispose()
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
    orbitControls.minZoom = 0.01
    orbitControls.maxZoom = 10.0
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
    drafter,
    raycastHelper,
    selection,
    controllers,
    statsPanel,
}

function loadAssets(): Promise<[THREE.Object3D]> {
    return Promise.all([loadGlb("/cube.glb")])
}
