import * as THREE from "three"
import * as shape from "./objects/geometries/geometry"
import { OrbitControls } from "three/examples/jsm/Addons.js"
import { AspectLayout } from "./utils/AspectLayout"
import { loadGlb } from "./utils/loader"
import { RaycastHelper } from "./interaction/RaycastHelper"
import { Drafter } from "./draft/Drafter"
import * as rand from "./utils/random"
import type { NodeLocation } from "./draft/TransformTree"

let isAppReady = false
const cube = new THREE.Mesh(
    // shape.makeCustomMergeShape(),
    shape.makeCustomBVHShape(),
    // shape.makeCustomBVHHierarchyShape(),
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

let raycastHelper!: RaycastHelper
let drafter!: Drafter

let testNode: any
let testNodeVelocityX = 0.02

export function init(container: HTMLElement): () => void {
    // const assetsLoader = loadAssets()

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
    camera.zoom = 0.075
    camera.position.set(0, 100, 0)
    camera.lookAt(0, 0, 0)

    //orbitControls
    orbitControls = initOrbit(camera, renderer)
    console.log({ orbitControls })

    // content
    const ambient = new THREE.AmbientLight(0xffffff, 0.7)
    const sun = new THREE.DirectionalLight(0xffffff, 0.9)
    sun.position.set(2, 3, 4)
    const gridHelper = new THREE.GridHelper()
    const axesHelper = new THREE.AxesHelper(10)
    axesHelper.renderOrder = 1

    // scene.add(ambient, sun, gridHelper, axesHelper)
    scene.add(ambient, sun)

    function makeDrafterArgs(arr: any[]) {
        for (let i = 0; i < arr.length; i++) {
            const item = arr[i]
            arr[i] = {
                parent: {
                    id: 0,
                    index: item.parent,
                },
                node: {
                    position: item.pos,
                },
            }
        }
        return arr as any
    }

    // Drafter
    drafter = new Drafter(scene)

    const initalGeo = cube.geometry
    const scale = rand.random(0.75, 1.5)
    const initalTransform = new THREE.Matrix4()
        .makeRotationX(
            rand.randomItem([0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2])
            // rand.random(0, Math.PI * 2)
        )
        .scale(new THREE.Vector3(scale, scale, scale))
    const initalNodes = makeDrafterArgs([
        // { pos: new THREE.Vector3(0, 0, 0), parent: 0 },
        { pos: new THREE.Vector3(5, 0, 5), parent: 0 },
        { pos: new THREE.Vector3(5, 0, 0), parent: 1 },
        { pos: new THREE.Vector3(5, 0, -5), parent: 2 },
        { pos: new THREE.Vector3(-5, 0, -5), parent: 0 },
        { pos: new THREE.Vector3(-5, 0, 5), parent: 0 },
        { pos: new THREE.Vector3(10, 0, 0), parent: 2 },
        { pos: new THREE.Vector3(-10, 0, 0), parent: 0 },
    ])

    drafter.newInstance(initalGeo, initalTransform)

    for (let i = 0; i < initalNodes.length; i++) {
        const wip = initalNodes[i]
        drafter.addNode(wip.parent, wip.node)
    }

    ;(globalThis as any).drafter = drafter
    console.log(drafter)

    testNode = drafter.tree.findNode({ id: 0, index: 2 })

    // const [loadedCubeModel] = await assetsLoader
    // if (!loadedCubeModel) {
    //     throw new Error('Failed to resolve asset "/cube.glb"')
    // }
    // scene.add(loadedCubeModel)

    raycastHelper = new RaycastHelper(
        camera,
        drafter.interactivObjects,
        renderer.domElement
    )

    layout.addResizeListener(renderer, camera, render)

    frameId = globalThis.requestAnimationFrame(animate)

    globalThis.addEventListener("pointerdown", (e) => {
        let intersects = raycastHelper.castFromEvent(e)
        if (intersects.length === 0) return
        // dont needd early retuirns if we use drafter.interactiveObjects
        const int = intersects[0]
        // if (!int.face) return
        const id = int.object.userData.id
        // if (!id) return
        const index = int.instanceId
        // if (!index) return
        const location = { id, index } as NodeLocation
        const node = drafter.tree.findNode(location) as any
        if (!node) return
        console.log("TEST INT")
        console.log(int)
        console.log({ id, index })
        console.log(node)
        node.position.copy(new THREE.Vector3(1, 0, 3))
        drafter.updatePatchedNode(node)
    })

    isAppReady = true
    return dispose
}

function render(): void {
    orbitControls.update()
    renderer.render(scene, camera)
    if (testNode) {
        testNode.position.x += testNodeVelocityX
        if (testNode.position.x >= 10 || testNode.position.x <= -10) {
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
