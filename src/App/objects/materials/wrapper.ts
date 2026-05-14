import * as THREE from "three"

export type MaterialClass = new (parameters?: any) => THREE.Material

export type UniformMap = Record<string, { value: any }>

export type MaterialWithShader = THREE.Material & {
    shader?: THREE.WebGLProgramParametersWithUniforms
}

export type MaterialExtension = {
    parameterKeys?: readonly string[]
    createUniforms?: (parameters: Record<string, any>) => UniformMap
    installProperties?: (
        material: MaterialWithShader,
        uniforms: UniformMap,
        parameters: Record<string, any>
    ) => void
    vertex?: (
        source: string,
        shader: THREE.WebGLProgramParametersWithUniforms
    ) => string
    fragment?: (
        source: string,
        shader: THREE.WebGLProgramParametersWithUniforms
    ) => string
}

function stripExtensionParameters(
    parameters: Record<string, any>,
    keys: readonly string[] = []
) {
    const baseParameters = { ...parameters }
    for (const key of keys) {
        delete baseParameters[key]
    }
    return baseParameters
}

export function extendMaterialInstance<TMaterial extends THREE.Material>(
    material: TMaterial,
    extension: MaterialExtension,
    parameters: Record<string, any> = {}
) {
    const uniforms = extension.createUniforms?.(parameters) ?? {}
    extension.installProperties?.(
        material as MaterialWithShader,
        uniforms,
        parameters
    )

    const previousOnBeforeCompile = material.onBeforeCompile

    material.onBeforeCompile = function (shader, renderer) {
        previousOnBeforeCompile?.call(this, shader, renderer)

        shader.uniforms = {
            ...shader.uniforms,
            ...uniforms,
        }

        if (extension.vertex) {
            shader.vertexShader = extension.vertex(shader.vertexShader, shader)
        }

        if (extension.fragment) {
            shader.fragmentShader = extension.fragment(
                shader.fragmentShader,
                shader
            )
        }

        ;(this as MaterialWithShader).shader = shader
        this.userData.shader = shader
    }

    material.needsUpdate = true
    return material as TMaterial & MaterialWithShader
}

export function extendMaterialClass<TBase extends MaterialClass>(
    BaseMaterial: TBase,
    extension: MaterialExtension
) {
    type BaseParameters = ConstructorParameters<TBase>[0]
    type Parameters = BaseParameters & Record<string, any>
    const WrappedBaseMaterial = BaseMaterial as new (
        ...args: any[]
    ) => THREE.Material

    return class ExtendedMaterial extends WrappedBaseMaterial {
        constructor(...args: any[]) {
            const parameters = (args[0] ?? {}) as Parameters
            const baseParameters = stripExtensionParameters(
                parameters,
                extension.parameterKeys ?? []
            )

            super(baseParameters as BaseParameters)

            extendMaterialInstance(this, extension, parameters)
        }
    } as unknown as new (
        parameters?: Parameters
    ) => InstanceType<TBase> & MaterialWithShader
}
