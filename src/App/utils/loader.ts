import * as THREE from "three"
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

export async function saveAsGlb(
    mesh: THREE.Object3D,
    filename = "model.glb"
): Promise<void> {
    const exporter = new GLTFExporter()
    const result = await new Promise<ArrayBuffer | object>(
        (resolve, reject) => {
            exporter.parse(mesh, resolve, reject, { binary: true })
        }
    )

    if (!(result instanceof ArrayBuffer)) {
        throw new Error("Expected binary GLB export")
    }

    downloadBlob(new Blob([result], { type: "model/gltf-binary" }), filename)
}

export async function saveAsGltf(
    mesh: THREE.Object3D,
    filename = "model.gltf"
): Promise<void> {
    function exportGltf(): Promise<ArrayBuffer | object> {
        const exporter = new GLTFExporter()

        return new Promise((resolve, reject) => {
            exporter.parse(mesh, resolve, reject, { binary: false })
        })
    }

    const result = await exportGltf()

    if (result instanceof ArrayBuffer) {
        throw new Error("Expected JSON glTF export")
    }

    downloadBlob(
        new Blob([JSON.stringify(result, null, 2)], {
            type: "model/gltf+json",
        }),
        filename
    )
}

export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)
}

export async function loadGlb(path: string): Promise<THREE.Object3D> {
    const loader = new GLTFLoader()

    return await new Promise((resolve, reject) => {
        loader.load(
            path,
            (gltf) => {
                resolve(gltf.scene)
            },
            (event) => {
                if (!event.total) {
                    return
                }

                const percentLoaded = (event.loaded / event.total) * 100
                console.log(`Loading ${path}: ${percentLoaded.toFixed(1)}%`)
            },
            (error) => {
                reject(error)
            }
        )
    })
}

export const loadGltf = loadGlb
