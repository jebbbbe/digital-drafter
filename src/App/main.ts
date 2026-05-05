import * as THREE from "three"
import * as shape from "./objects/geometries/geometry"
import { brushCleaner } from "./objects/geometries/brushCleaner"
import { OrbitControls } from "three/examples/jsm/Addons.js"
import { AspectLayout } from "./utils/AspectLayout"
import { loadGlb } from "./utils/loader"
import { InteractionManager } from "./interaction/InteractionManager"
import { Drafter } from "./draft/Drafter"
import * as rand from "./utils/random"

let isAppReady = false

const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    // shape.makeCustomMergeShape(),
    // shape.makeCustomBVHShape(),
    // shape.makeCustomBVHHierarchyShape(),
    // shape.makeAsterix(0.1),
    // shape.makeAsterix(30),
    // shape.makeBadSphere(0.95),
    // shape.createWeirdSphereoid(2),
    // shape.createMengerSpongeGeometry(2),
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

let interactionManager!: InteractionManager
let drafter!: Drafter

let testNode: any
let testNodeVelocityX = 0.001

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

    // scene
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xeef4ff)

    //camera
    camera = new THREE.OrthographicCamera(...layout.getThreeOrthographicArgs())
    camera.zoom = 0.175
    camera.position.set(0, 100, 0)
    camera.lookAt(0, 0, 0)

    //orbitControls
    orbitControls = initOrbit(camera, renderer)

    // content
    const ambient = new THREE.AmbientLight(0xffffff, 0.7)
    const sun = new THREE.DirectionalLight(0xffffff, 0.9)
    sun.position.set(2, 3, 4)
    const gridHelper = new THREE.GridHelper()
    const axesHelper = new THREE.AxesHelper(10)
    axesHelper.renderOrder = 1

    // scene.add(ambient, sun, gridHelper, axesHelper)
    // scene.add(ambient, sun)

    // Drafter
    drafter = new Drafter(scene)
    // const initalGeo = shape.makeCustomMergeShape()
    const initalGeo0 = shape.makeCustomBVHShape()
    // const initalGeo = shape.makeCustomBVHHierarchyShape()
    const initalGeo = shape.makeAsterix(0.1)
    const initalGeo1 = shape.makeAsterix(30)
    // const initalGeo = shape.makeBadSphere(0.95)
    // const initalGeo = shape.createWeirdSphereoid(2)
    // const initalGeo = shape.createMengerSpongeGeometry(2)
    drafter.newInstance(initalGeo)
    drafter.newInstance(initalGeo0)
    drafter.newInstance(initalGeo1)

    const scale = rand.random(0.75, 1.5)
    const initalTransform = new THREE.Matrix4()
        .makeRotationX(
            rand.randomItem([0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2])
            // rand.random(0, Math.PI * 2)
        )
        .scale(new THREE.Vector3(scale, scale, scale))

    // prettier-ignore
    const initalRoots = [
        { position: new THREE.Vector3(0, 0, 0), location: { id: 0 }, baseMatrix: initalTransform, },
        { position: new THREE.Vector3(4, 0, 4), location: { id: 0 }, baseMatrix: initalTransform, },
        { position: new THREE.Vector3(-4, 0, 4), location: { id: 0 }, baseMatrix: initalTransform, },

        { position: new THREE.Vector3(4, 0, -4), location: { id: 1 }, baseMatrix: initalTransform, },
        { position: new THREE.Vector3(-4, 0, -4), location: { id: 1 }, baseMatrix: new THREE.Matrix4(), },
       
        { position: new THREE.Vector3(-6, 0, -4), location: { id: 2 }, baseMatrix: initalTransform, },
    ]

    // prettier-ignore
    const initalNodes = [
        // { node:{position: new THREE.Vector3(0, 0, 0),   }, parent:{ id:0, index: -1 }},
        { node:{position: new THREE.Vector3(2, 0, 2),   }, parent:{ id:0, index: 0 }},
        { node:{position: new THREE.Vector3(2, 0, 0),   }, parent:{ id:0, index: 1 }},
        { node:{position: new THREE.Vector3(2, 0, -2),  }, parent:{ id:0, index: 2 }},
        { node:{position: new THREE.Vector3(-2, 0, -2), }, parent:{ id:0, index: 0 }},
        { node:{position: new THREE.Vector3(-2, 0, 2),  }, parent:{ id:0, index: 0 }},
        { node:{position: new THREE.Vector3(4, 0, 0),  }, parent:{ id:0, index: 2 }},
        { node:{position: new THREE.Vector3(-4, 0, 0), }, parent:{ id:0, index: 0 }},
        { node:{position: new THREE.Vector3(-4, 0, 2), }, parent:{ id:0, index: 5 }},
        { node:{position: new THREE.Vector3(-4, 0, -2), }, parent:{ id:0, index: 4 }},
        
    ]

    drafter.addRootNode(initalRoots[0] as any)
    for (let i = 0; i < initalNodes.length; i++) {
        const wip = initalNodes[i]
        drafter.addLeafNode(wip.node, wip.parent)
    }
    drafter.addRootNode(initalRoots[1] as any)
    drafter.addRootNode(initalRoots[2] as any)
    drafter.addRootNode(initalRoots[3] as any)
    drafter.addRootNode(initalRoots[4] as any)
    drafter.addRootNode(initalRoots[5] as any)


    ;(globalThis as any).drafter = drafter
    console.log(drafter)

    testNode = drafter.tree.findNode({ id: 0, index: 2 })

    // const [loadedCubeModel] = await assetsLoader
    // if (!loadedCubeModel) {
    //     throw new Error('Failed to resolve asset "/cube.glb"')
    // }
    // scene.add(loadedCubeModel)

    interactionManager = new InteractionManager({
        camera,
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
    orbitControls.update()
    renderer.render(scene, camera)
    if (testNode) {
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

export { isAppReady, renderer, scene, camera, orbitControls, cube, drafter }

function loadAssets(): Promise<[THREE.Object3D]> {
    return Promise.all([loadGlb("/cube.glb")])
}
