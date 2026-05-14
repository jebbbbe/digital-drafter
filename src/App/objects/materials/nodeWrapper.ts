import * as THREE from "three"
import { extendMaterialInstance, extendMaterialClass } from "./wrapper"
import type {
    MaterialWithShader,
    UniformMap,
    MaterialExtension,
    MaterialClass,
} from "./wrapper"
import { replaceShader } from "./treeShaderChunk"

type GlobalNodeMaterialParameters = {
    treeData?: THREE.DataTexture | null
    treeDataSize?: number
}

type GlobalNodeUniforms = {
    treeData: { value: THREE.DataTexture | null }
    treeDataSize: { value: number }
}

type GlobalNodeMaterialInstance = {
    shader?: THREE.WebGLProgramParametersWithUniforms
    customUniforms: GlobalNodeUniforms
    treeData?: THREE.DataTexture | null
    treeDataSize?: number
}

function defineUniformProperty(
    material: MaterialWithShader,
    uniforms: UniformMap,
    key: keyof UniformMap
) {
    Object.defineProperty(material, key, {
        configurable: true,
        get: () => uniforms[key].value,
        set: (value) => {
            uniforms[key].value = value
            if (material.shader) {
                material.shader.uniforms[key].value = value
            }
        },
    })
}

const nodeMatrixExtension: MaterialExtension = {
    parameterKeys: ["treeData", "treeDataSize"],
    createUniforms: (parameters) => ({
        treeData: {
            value: parameters.treeData ?? null,
        },
        treeDataSize: {
            value: parameters.treeDataSize ?? 1,
        },
    }),
    installProperties: (material, uniforms) => {
        defineUniformProperty(material, uniforms, "treeData")
        defineUniformProperty(material, uniforms, "treeDataSize")
    },
    vertex: (source) => {
        let vertexShader = source.replace(
            "#include <common>",
            "#include <common>\n#include <tree_attribute>\n#include <tree_funcitons>"
        )
        vertexShader = vertexShader.replace(
            "void main() {",
            "void main() {\n\t#include <tree_main>"
        )
        return replaceShader(vertexShader)
    },
}

export function patchNodeMatrix<TMaterial extends THREE.Material>(
    material: TMaterial,
    parameters: GlobalNodeMaterialParameters = {}
) {
    return extendMaterialInstance(
        material,
        nodeMatrixExtension,
        parameters
    ) as TMaterial & GlobalNodeMaterialInstance
}

export function patchNodeMatrixClass<TBase extends MaterialClass>(
    BaseMaterial: TBase
) {
    type Parameters = ConstructorParameters<TBase>[0] &
        GlobalNodeMaterialParameters
    type MaterialInstance = InstanceType<TBase> & GlobalNodeMaterialInstance

    return extendMaterialClass(
        BaseMaterial,
        nodeMatrixExtension
    ) as unknown as new (parameters?: Parameters) => MaterialInstance
}

const str = ""
str.replace(
    `vLineDistance = scale * lineDistance;`,
    `vec3 _scale = length(vec3(treeMatrix[0]));\n\tvLineDistance = _scale * lineDistance;`
)
