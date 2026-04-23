import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three'

const CAMERA_DISTANCE = 2.7

export function mountRotatingCube(container: HTMLElement): () => void {
  const scene = new Scene()
  scene.background = new Color('#eef4ff')

  const camera = new PerspectiveCamera(60, 1, 0.1, 100)
  camera.position.set(CAMERA_DISTANCE, CAMERA_DISTANCE * 0.65, CAMERA_DISTANCE)
  camera.lookAt(0, 0, 0)

  const renderer = new WebGLRenderer({
    antialias: false,
    powerPreference: 'high-performance',
  })

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  container.appendChild(renderer.domElement)

  const cube = new Mesh(
    new BoxGeometry(1, 1, 1),
    new MeshStandardMaterial({
      color: '#1d8bff',
      roughness: 0.35,
      metalness: 0.08,
    }),
  )

  scene.add(cube)

  const ambient = new AmbientLight(0xffffff, 0.7)
  const sun = new DirectionalLight(0xffffff, 0.9)
  sun.position.set(2, 3, 4)
  scene.add(ambient, sun)

  const resize = () => {
    const width = container.clientWidth
    const height = container.clientHeight

    if (!width || !height) {
      return
    }

    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, false)
  }

  resize()

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(container)

  let frameId = 0

  const animate = () => {
    cube.rotation.x += 0.009
    cube.rotation.y += 0.012
    renderer.render(scene, camera)
    frameId = window.requestAnimationFrame(animate)
  }

  frameId = window.requestAnimationFrame(animate)

  return () => {
    window.cancelAnimationFrame(frameId)
    resizeObserver.disconnect()
    cube.geometry.dispose()
    cube.material.dispose()
    renderer.dispose()
    renderer.domElement.remove()
  }
}
