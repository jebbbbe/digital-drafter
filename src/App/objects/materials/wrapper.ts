import * as THREE from "three"

export type MaterialClass = new (parameters?: any) => THREE.Material

type UniformMap = Record<string, THREE.IUniform>

type ExtendedBaseMaterial = THREE.Material & {
    uniforms?: UniformMap
}

export type ExtendedMaterial<T extends Record<string, any>> = T & {
    uniforms: { [K in keyof T]-?: THREE.IUniform<T[K]> }
}

export type ExtendedMaterialClass<
    TBase extends MaterialClass,
    T extends Record<string, any>,
> = new (
    parameters?: ConstructorParameters<TBase>[0] & T
) => InstanceType<TBase> & ExtendedMaterial<T>

export type MaterialExtension = {
    uniforms?: Record<string, any>
    onBeforeCompile?: (
        shader: THREE.WebGLProgramParametersWithUniforms,
        material: ExtendedBaseMaterial,
        renderer: THREE.WebGLRenderer
    ) => void
}

function applyMaterialExtension(
    extension: MaterialExtension,
    material: ExtendedBaseMaterial,
    parameters: Record<string, any> = {}
) {
    const uniforms = material.uniforms ?? {}
    const uniformKeys = Object.keys(extension.uniforms ?? {})

    material.uniforms = uniforms

    for (const key of uniformKeys) {
        if (!(key in uniforms)) {
            uniforms[key] = {
                value: parameters[key] ?? extension.uniforms?.[key],
            }
        }

        Object.defineProperty(material, key, {
            configurable: true,
            get: () => uniforms[key].value,
            set: (value) => {
                uniforms[key].value = value
            },
        })
    }

    const previousOnBeforeCompile = material.onBeforeCompile

    material.onBeforeCompile = function (shader, renderer) {
        if (uniformKeys.length > 0) {
            shader.uniforms = {
                ...shader.uniforms,
                ...uniforms,
            }
        }

        previousOnBeforeCompile?.call(this, shader, renderer)
        extension.onBeforeCompile?.(
            shader,
            this as ExtendedBaseMaterial,
            renderer
        )
    }

    const prevCopy = material.copy
    material.copy = function (source: THREE.Material): ExtendedBaseMaterial {
        const copied = prevCopy.call(this, source) as ExtendedBaseMaterial
        applyMaterialExtension(
            extension,
            copied,
            source as Record<string, any>
        )

        for (const key of uniformKeys) {
            const sourceUniform = (source as ExtendedBaseMaterial).uniforms?.[key]
            if (sourceUniform) {
                ;(copied as Record<string, any>)[key] = sourceUniform.value
            }
        }

        return copied
    }

    material.clone = function (): ExtendedBaseMaterial {
        const MaterialConstructor = this.constructor as MaterialClass
        const cloned = new MaterialConstructor() as ExtendedBaseMaterial
        return this.copy.call(cloned, this as THREE.Material)
    }

    material.needsUpdate = true
    return material
}

export const extendMaterialInstance = <TMaterial extends THREE.Material>(
    extension: MaterialExtension,
    material: TMaterial
) => {
    return applyMaterialExtension(extension, material as ExtendedBaseMaterial)
}

export function extendMaterialClass<TBase extends MaterialClass>(
    extension: MaterialExtension,
    BaseMaterial: TBase
) {
    type BaseParameters = ConstructorParameters<TBase>[0]
    type Parameters = BaseParameters & Record<string, any>
    const WrappedBaseMaterial = BaseMaterial as new (
        ...args: any[]
    ) => THREE.Material

    return class ExtendedMaterial extends WrappedBaseMaterial {
        constructor(...args: any[]) {
            const parameters = (args[0] ?? {}) as Parameters
            const baseParameters = { ...parameters }

            for (const key of Object.keys(extension.uniforms ?? {})) {
                delete baseParameters[key]
            }

            super(baseParameters as BaseParameters)

            applyMaterialExtension(
                extension,
                this as ExtendedBaseMaterial,
                parameters
            )
        }
    } as unknown as ExtendedMaterialClass<TBase, Record<string, any>>
}
