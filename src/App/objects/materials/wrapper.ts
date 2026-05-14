import * as THREE from "three"

export type MaterialClass = new (parameters?: any) => THREE.Material

type UniformMap = Record<string, { value: any }>

type ExtendedBaseMaterial = THREE.Material & {
    customUniforms?: UniformMap
}

export type ExtendedMaterial<T extends Record<string, any>> = T & {
    customUniforms: { [K in keyof T]-?: { value: T[K] } }
}

export type ExtendedMaterialClass<
    TBase extends MaterialClass,
    T extends Record<string, any>,
> = new (
    parameters?: ConstructorParameters<TBase>[0] & T
) => InstanceType<TBase> & ExtendedMaterial<T>

export type MaterialExtension = {
    customUniforms?: Record<string, any>
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
    const customUniforms = material.customUniforms ?? {}
    const uniformKeys = Object.keys(extension.customUniforms ?? {})

    material.customUniforms = customUniforms

    for (const key of uniformKeys) {
        if (!(key in customUniforms)) {
            customUniforms[key] = {
                value: parameters[key] ?? extension.customUniforms?.[key],
            }
        }

        Object.defineProperty(material, key, {
            configurable: true,
            get: () => customUniforms[key].value,
            set: (value) => {
                customUniforms[key].value = value
            },
        })
    }

    const previousOnBeforeCompile = material.onBeforeCompile

    material.onBeforeCompile = function (shader, renderer) {
        if (uniformKeys.length > 0) {
            shader.uniforms = {
                ...shader.uniforms,
                ...customUniforms,
            }
        }

        previousOnBeforeCompile?.call(this, shader, renderer)
        extension.onBeforeCompile?.(
            shader,
            this as ExtendedBaseMaterial,
            renderer
        )
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

            for (const key of Object.keys(extension.customUniforms ?? {})) {
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
