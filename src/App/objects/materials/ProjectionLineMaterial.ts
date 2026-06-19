import * as THREE from "three"

type ProjectionLineMaterialParameters = THREE.LineBasicMaterialParameters & {
    treeData?: THREE.DataTexture | null
    treeDataSize?: number
}

export class ProjectionLineMaterial extends THREE.LineBasicMaterial {
    shader?: THREE.WebGLProgramParametersWithUniforms
    customUniforms: {
        treeData: { value: THREE.DataTexture | null }
        treeDataSize: { value: number }
    }

    constructor(parameters: ProjectionLineMaterialParameters = {}) {
        const params = structuredClone(parameters)
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
                "#include <common>\n#include <tree_attribute>\n#include <tree_funcitons>"
            )
            shader.vertexShader = shader.vertexShader.replace(
                "void main() {",
                "void main() {\n\t#include <tree_main>"
            )

            shader.vertexShader = shader.vertexShader.replace(
                "#include <begin_vertex>",
                "#include <begin_vertex>" +
                    /* glsl */ `
                vec4 parentMetadata = vec4(0.);
                mat4 parentNodeMatrix = mat4(1.0);
                readTreeData(parentSlot, parentNodeMatrix, parentMetadata);
                vec3 childTransformed = (nodeMatrix * vec4(transformed, 1.0)).xyz;
                vec3 parentTransformed = (parentNodeMatrix * vec4(transformed, 1.0)).xyz;

                if ( gl_VertexID % 2 == 0) {
                    transformed = childTransformed;
                } else {
                    transformed = parentTransformed;
                }
                if(childTransformed.y > 0.0 && parentTransformed.y>0.0 ){
                    // transformed.y = 5.0;
                }else{
                    transformed.y = -5.0;
                }
                `
            )
            this.shader = shader
        }
    }
}

declare module "three" {
    interface LineBasicMaterial {
        treeData?: THREE.DataTexture | null
        treeDataSize?: number
    }
}
