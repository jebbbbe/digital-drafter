import * as THREE from "three"

type DisposableObject3D = THREE.Object3D & {
    geometry?: THREE.BufferGeometry
    material?: THREE.Material | THREE.Material[]
}

export function disposeGroup(group: THREE.Object3D) {
    group.traverse((object) => {
        const disposableObject = object as DisposableObject3D

        // Dispose geometry
        disposableObject.geometry?.dispose()

        // Dispose material(s)
        if (disposableObject.material) {
            const materials = Array.isArray(disposableObject.material)
                ? disposableObject.material
                : [disposableObject.material]

            materials.forEach((material) => {
                // Dispose textures referenced by the material
                for (const value of Object.values(
                    material as unknown as Record<string, unknown>
                )) {
                    if (value instanceof THREE.Texture) {
                        value.dispose()
                    }
                }

                material.dispose()
            })
        }
    })

    // Remove from parent
    if (group.parent) {
        group.parent.remove(group)
    }
}
