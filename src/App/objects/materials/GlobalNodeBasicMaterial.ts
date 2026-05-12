import * as THREE from "three"
import { glslChunks } from "../textures/glsl"

type GlobalNodeBasicParameters = THREE.MeshBasicMaterialParameters & {
    nodeData?: THREE.DataTexture | null
    nodeDataSize?: number
}

export class GlobalNodeBasicMaterial extends THREE.MeshBasicMaterial {
    shader?: THREE.WebGLProgramParametersWithUniforms
    customUniforms: {
        nodeData: { value: THREE.DataTexture | null }
        nodeDataSize: { value: number }
    }

    constructor(parameters: GlobalNodeBasicParameters = {}) {
        const params = { ...parameters }
        delete params.nodeData
        delete params.nodeDataSize
        super(params)

        this.customUniforms = {
            nodeData: {
                value: parameters.nodeData ?? null,
            },
            nodeDataSize: {
                value: parameters.nodeDataSize ?? 1,
            },
        }

        Object.defineProperty(this, "nodeData", {
            get: () => this.customUniforms.nodeData.value,
            set: (value: THREE.DataTexture | null) => {
                this.customUniforms.nodeData.value = value
                if (this.shader) {
                    this.shader.uniforms.nodeData.value = value
                }
            },
        })

        Object.defineProperty(this, "nodeDataSize", {
            get: () => this.customUniforms.nodeDataSize.value,
            set: (value: number) => {
                this.customUniforms.nodeDataSize.value = value
                if (this.shader) {
                    this.shader.uniforms.nodeDataSize.value = value
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

                mat4 loadGlobalNodeBasicMatrix() {
                    mat4 matrix;
                    vec4 metadata;
                    readNodeData(int(nodeSlot), matrix, metadata);
                    return matrix;
                }
                `
            )

            shader.vertexShader = shader.vertexShader.replace(
                "#include <begin_vertex>",
                /* glsl */ `
                #include <begin_vertex>

                #ifdef USE_INSTANCING
                    transformed = (loadGlobalNodeBasicMatrix() * vec4(transformed, 1.0)).xyz;
                #endif
                `
            )

            this.shader = shader
        }
    }
}

declare module "three" {
    interface MeshBasicMaterial {
        nodeData?: THREE.DataTexture | null
        nodeDataSize?: number
    }
}
