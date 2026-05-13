import * as THREE from "three"
import { glslChunks } from "../textures/glsl"

type GlobalTreeBasicParameters = THREE.MeshBasicMaterialParameters & {
    treeData?: THREE.DataTexture | null
    treeDataSize?: number
}

export class GlobalTreeBasicMaterial extends THREE.MeshBasicMaterial {
    shader?: THREE.WebGLProgramParametersWithUniforms
    customUniforms: {
        treeData: { value: THREE.DataTexture | null }
        treeDataSize: { value: number }
    }

    constructor(parameters: GlobalTreeBasicParameters = {}) {
        const params = { ...parameters }
        delete params.treeData
        delete params.treeDataSize
        super(params)

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

        this.onBeforeCompile = (shader) => {
            shader.uniforms = {
                ...shader.uniforms,
                ...this.customUniforms,
            }

            shader.vertexShader = shader.vertexShader.replace(
                "#include <common>",
                /* glsl */ `
                #include <common>
                attribute float nodeSlot;
                ${glslChunks.attribute}
                ${glslChunks.read}

                mat4 loadGlobalTreeBasicMatrix() {
                    mat4 matrix;
                    vec4 metadata;
                    readTreeData(int(nodeSlot), matrix, metadata);
                    return matrix;
                }
                `
            )

            shader.vertexShader = shader.vertexShader.replace(
                "#include <begin_vertex>",
                /* glsl */ `
                #include <begin_vertex>

                #ifdef USE_INSTANCING
                    transformed = (loadGlobalTreeBasicMatrix() * vec4(transformed, 1.0)).xyz;
                #endif
                `
            )

            this.shader = shader
        }
    }
}

declare module "three" {
    interface MeshBasicMaterial {
        treeData?: THREE.DataTexture | null
        treeDataSize?: number
    }
}
