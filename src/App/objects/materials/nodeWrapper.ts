import * as THREE from "three"
import { extendMaterialClass, extendMaterialInstance } from "./wrapper"
import type {
    ExtendedMaterial,
    ExtendedMaterialClass,
    MaterialClass,
    MaterialExtension,
} from "./wrapper"
import { replaceShader, replaceShaderVariables } from "./treeShaderChunk"
import { InstanceCount } from "../../constants"

type GlobalNodeMaterial = {
    treeData?: THREE.DataTexture | null
    treeDataSize?: number
    treeBlockOffset?: number
    treeBlockSize?: number
}

const nodeMatrixExtension: MaterialExtension = {
    uniforms: {
        treeData: null,
        treeDataSize: 1,
        treeBlockOffset: 0,
        treeBlockSize: InstanceCount,
    },
    onBeforeCompile: (shader) => {
        shader.vertexShader = shader.vertexShader.replace(
            "#include <common>",
            "#include <common>\n" +
                "#include <uniform_tree>\n" +
                "#include <tree_funcitons>"
        )
        shader.vertexShader = shader.vertexShader.replace(
            "void main() {",
            "void main() {\n\t#include <tree_main>"
        )
        shader.vertexShader = replaceShader(shader.vertexShader)
        shader.vertexShader = replaceShaderVariables(shader.vertexShader)
    },
}

export function patchNodeMatrix<TMaterial extends THREE.Material>(
    material: TMaterial
) {
    return extendMaterialInstance(nodeMatrixExtension, material) as TMaterial &
        ExtendedMaterial<GlobalNodeMaterial>
}

export function patchNodeMatrixClass<TBase extends MaterialClass>(
    BaseMaterial: TBase
) {
    return extendMaterialClass(
        nodeMatrixExtension,
        BaseMaterial
    ) as ExtendedMaterialClass<TBase, GlobalNodeMaterial>
}

const dashedLineExtension: MaterialExtension = {
    // make scale read from nodeMatrix isntead of from the uniform.
    // this lets us use only 1 material isntead of per instance material with different scales.
    onBeforeCompile: (shader) => {
        shader.vertexShader = shader.vertexShader.replace(
            `vLineDistance = scale * lineDistance;`,
            `float _scale = length(nodeMatrix[0].xyz);\n\tvLineDistance = _scale * lineDistance;`
        )
    },
}

export function patchDashedLine<TMaterial extends THREE.Material>(
    material: TMaterial
) {
    return extendMaterialInstance(dashedLineExtension, material) as TMaterial &
        ExtendedMaterial<GlobalNodeMaterial>
}

export function patchDashedLineClass<TBase extends MaterialClass>(
    BaseMaterial: TBase
) {
    return extendMaterialClass(
        dashedLineExtension,
        BaseMaterial
    ) as ExtendedMaterialClass<TBase, GlobalNodeMaterial>
}
