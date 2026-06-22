import * as THREE from "three"

import uniformTree from "./glsl/uniformTree.glsl?raw"
import treeFuncitons from "./glsl/treeFuncitons.glsl?raw"
import treeMain from "./glsl/treeMain.glsl?raw"

import uniformFold from "./glsl/uniformFoldLine.glsl?raw"
import instancedLine from "./glsl/instancedLine.glsl?raw"

const replaceGLSL = {
    // oldString:newString
    instanceMatrix: "nodeMatrix",
}

const replaceIncludes = {
    "<color_vertex>": "<tree_color_vertex>",
    "<defaultnormal_vertex>": "<tree_defaultnormal_vertex>",
    "<project_vertex>": "<tree_project_vertex>",
    "<worldpos_vertex>": "<tree_worldpos_vertex>",
}

export function replaceShader(
    snip: string,
    map: Record<string, string> = replaceIncludes
): string {
    let replaced = snip
    for (const [key, value] of Object.entries(map)) {
        replaced = replaced.replaceAll(key, value)
    }
    return replaced
}
export const replaceShaderVariables = (s: string) =>
    replaceShader(s, replaceGLSL)

// patch into shader chunk
const shaderChunks = THREE.ShaderChunk as Record<string, string>

shaderChunks["tree_color_vertex"] = replaceShader(
    THREE.ShaderChunk.color_vertex,
    replaceGLSL
)
shaderChunks["tree_defaultnormal_vertex"] = replaceShader(
    THREE.ShaderChunk.defaultnormal_vertex,
    replaceGLSL
)
shaderChunks["tree_project_vertex"] = replaceShader(
    THREE.ShaderChunk.project_vertex,
    replaceGLSL
)
shaderChunks["tree_worldpos_vertex"] = replaceShader(
    THREE.ShaderChunk.worldpos_vertex,
    replaceGLSL
)

// new chunks
// tree texture
shaderChunks["uniform_tree"] = uniformTree
shaderChunks["tree_funcitons"] = treeFuncitons
shaderChunks["tree_main"] = treeMain
//instancedLine
shaderChunks["instanced_line"] = instancedLine
// fold line
shaderChunks["uniform_fold"] = uniformFold
