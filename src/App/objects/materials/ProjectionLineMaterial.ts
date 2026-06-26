import * as THREE from "three"
import { InstanceCount } from "../../constants"

type ProjectionLineMaterialParameters = THREE.LineBasicMaterialParameters & {
    treeData?: THREE.DataTexture | null
    treeDataSize?: number
    treeBlockOffset?: number
    treeBlockSize?: number
}

export class ProjectionLineMaterial extends THREE.LineBasicMaterial {
    uniforms: {
        treeData: THREE.IUniform<THREE.DataTexture | null>
        treeDataSize: THREE.IUniform<number>
        treeBlockOffset: THREE.IUniform<number>
        treeBlockSize: THREE.IUniform<number>
    }

    constructor(parameters: ProjectionLineMaterialParameters = {}) {
        const params = structuredClone(parameters)
        delete params.treeData
        delete params.treeDataSize
        delete params.treeBlockOffset
        delete params.treeBlockSize
        super(params)

        this.uniforms = {
            treeData: {
                value: parameters.treeData ?? null,
            },
            treeDataSize: {
                value: parameters.treeDataSize ?? 1,
            },
            treeBlockOffset: {
                value: parameters.treeBlockOffset ?? 0,
            },
            treeBlockSize: {
                value: parameters.treeBlockSize ?? InstanceCount,
            },
        }

        Object.defineProperty(this, "treeData", {
            get: () => this.uniforms.treeData.value,
            set: (value: THREE.DataTexture | null) => {
                this.uniforms.treeData.value = value
            },
        })

        Object.defineProperty(this, "treeDataSize", {
            get: () => this.uniforms.treeDataSize.value,
            set: (value: number) => {
                this.uniforms.treeDataSize.value = value
            },
        })

        Object.defineProperty(this, "treeBlockOffset", {
            get: () => this.uniforms.treeBlockOffset.value,
            set: (value: number) => {
                this.uniforms.treeBlockOffset.value = value
            },
        })

        Object.defineProperty(this, "treeBlockSize", {
            get: () => this.uniforms.treeBlockSize.value,
            set: (value: number) => {
                this.uniforms.treeBlockSize.value = value
            },
        })

        this.onBeforeCompile = (shader) => {
            shader.uniforms = {
                ...shader.uniforms,
                ...this.uniforms,
            }
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
        }
    }
}

declare module "three" {
    interface LineBasicMaterial {
        treeData?: THREE.DataTexture | null
        treeDataSize?: number
        treeBlockOffset?: number
        treeBlockSize?: number
    }
}
