import * as THREE from "three"

type InstancedProjectionMaterialParameters =
    THREE.LineBasicMaterialParameters & {
        treeData?: THREE.DataTexture | null
        treeDataSize?: number
        foldDistance?: number
        foldSize?: number
    }

export class FoldLineMaterial extends THREE.LineBasicMaterial {
    shader?: THREE.WebGLProgramParametersWithUniforms
    customUniforms: {
        treeData: { value: THREE.DataTexture | null }
        treeDataSize: { value: number }
        foldDistance: { value: number }
        foldSize: { value: number }
    }

    constructor(parameters: InstancedProjectionMaterialParameters = {}) {
        const params = structuredClone(parameters)
        delete params.treeData
        delete params.treeDataSize
        delete params.foldDistance
        delete params.foldSize
        super(params)

        this.customUniforms = {
            treeData: {
                value: parameters.treeData ?? null,
            },
            treeDataSize: {
                value: parameters.treeDataSize ?? 1,
            },
            foldDistance: {
                value: parameters.foldDistance ?? 1.1,
            },
            foldSize: {
                value: parameters.foldSize ?? 1.1,
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

        Object.defineProperty(this, "foldDistance", {
            get: () => this.customUniforms.foldDistance.value,
            set: (value: number) => {
                this.customUniforms.foldDistance.value = value
                if (this.shader) {
                    this.shader.uniforms.foldDistance.value = value
                }
            },
        })

        Object.defineProperty(this, "foldSize", {
            get: () => this.customUniforms.foldSize.value,
            set: (value: number) => {
                this.customUniforms.foldSize.value = value
                if (this.shader) {
                    this.shader.uniforms.foldSize.value = value
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
                "#include <common>\n#include <tree_attribute>\n#include <tree_funcitons>" +
                    `uniform float foldSize;\nuniform float foldDistance;`
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

                // extract matrix info
                float scale = length(nodeMatrix[0].xyz);
                vec2 childPos = nodeMatrix[3].xz; 
                vec2 parentPos = parentNodeMatrix[3].xz; 
                vec2 dir = normalize(parentPos - childPos);
                vec2 norm = dir.yx * vec2(-1.,1.);
                int id = gl_VertexID % 4;
				float halfNodeDistance = distance(childPos, parentPos)/2.0;

				// constrain fold line when nodes are to
				float adjFoldDistance = foldDistance;
				if (adjFoldDistance > halfNodeDistance){
					adjFoldDistance = halfNodeDistance;
				}	

                dir *= adjFoldDistance;
                norm *= foldSize/2.0;

                if(id == 0){
                    transformed.xz = childPos + dir + norm;
                }else if (id == 1){
                    transformed.xz = childPos + dir - norm;
                }else if (id == 2){
                    transformed.xz = parentPos - dir + norm;
                }else if (id == 3){
                    transformed.xz = parentPos - dir - norm;
                    
                }
                


                // if ( gl_VertexID % 2 == 0) {
                //     transformed = (nodeMatrix * vec4(transformed, 1.0)).xyz;
                // } else {
                //     transformed = (parentNodeMatrix * vec4(transformed, 1.0)).xyz;
                // }
                transformed.y = 10.0;
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
        foldDistance?: number
        foldSize?: number
    }
}
