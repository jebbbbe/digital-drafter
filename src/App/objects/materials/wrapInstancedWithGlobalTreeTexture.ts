import * as THREE from "three"
import { replaceShader } from "./treeShaderChunk"

type GlobalNodeMaterialParameters = {
    treeData?: THREE.DataTexture | null
    treeDataSize?: number
}

type GlobalNodeUniforms = {
    treeData: { value: THREE.DataTexture | null }
    treeDataSize: { value: number }
}

type MaterialClass = new (parameters?: any) => THREE.Material

type GlobalNodeMaterialInstance = {
    shader?: THREE.WebGLProgramParametersWithUniforms
    customUniforms: GlobalNodeUniforms
    treeData?: THREE.DataTexture | null
    treeDataSize?: number
}

export const wrapInstancedWithGlobalTreeTexture = <TBase extends MaterialClass>(
    BaseMaterial: TBase
) => {
    type BaseParameters = ConstructorParameters<TBase>[0]
    type Parameters = BaseParameters & GlobalNodeMaterialParameters
    type MaterialInstance = InstanceType<TBase> & GlobalNodeMaterialInstance
    const WrappedBaseMaterial = BaseMaterial as new (
        ...args: any[]
    ) => THREE.Material

    return class GlobalNodeMaterial extends WrappedBaseMaterial {
        declare treeData?: THREE.DataTexture | null
        declare treeDataSize?: number
        shader?: THREE.WebGLProgramParametersWithUniforms
        customUniforms: GlobalNodeUniforms

        constructor(...args: any[]) {
            const parameters = (args[0] ?? {}) as Parameters
            const params = { ...parameters }
            delete params.treeData
            delete params.treeDataSize
            super(params as BaseParameters)

            this.customUniforms = {
                treeData: {
                    value: parameters.treeData ?? null,
                },
                treeDataSize: {
                    value: parameters.treeDataSize ?? 1,
                },
            }

            Object.defineProperty(this, "treeData", {
                get: () => this.customUniforms.treeData.value,
                set: (value: THREE.DataTexture | null) => {
                    this.customUniforms.treeData.value = value
                    if (this.shader) {
                        this.shader.uniforms.treeData.value = value
                    }
                },
            })

            Object.defineProperty(this, "treeDataSize", {
                get: () => this.customUniforms.treeDataSize.value,
                set: (value: number) => {
                    this.customUniforms.treeDataSize.value = value
                    if (this.shader) {
                        this.shader.uniforms.treeDataSize.value = value
                    }
                },
            })

            const previousOnBeforeCompile = this.onBeforeCompile

            this.onBeforeCompile = (shader, renderer) => {
                previousOnBeforeCompile?.call(this, shader, renderer)
                shader.uniforms = {
                    ...shader.uniforms,
                    ...this.customUniforms,
                }
                shader.vertexShader = shader.vertexShader.replace(
                    "#include <common>",
                    "#include <common>\n#include <tree_attribute>\n#include <tree_funcitons>"
                )
                shader.vertexShader = shader.vertexShader.replace(
                    "void main() {",
                    "void main() {\n\t#include <tree_main>"
                )
                shader.vertexShader = replaceShader(shader.vertexShader)
                console.log(shader.vertexShader)
                this.shader = shader
            }
        }
    } as unknown as new (parameters?: Parameters) => MaterialInstance
}
