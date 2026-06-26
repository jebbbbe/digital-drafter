import * as THREE from "three"
import { InstanceCount } from "../../constants"

type FoldLineMaterialParameters = THREE.LineBasicMaterialParameters & {
    treeData?: THREE.DataTexture | null
    treeDataSize?: number
    foldDistance?: number
    foldSize?: number
    treeBlockOffset?: number
    treeBlockSize?: number
}

export class FoldLineMaterial extends THREE.LineBasicMaterial {
    uniforms: {
        treeData: THREE.IUniform<THREE.DataTexture | null>
        treeDataSize: THREE.IUniform<number>
        foldDistance: THREE.IUniform<number>
        foldSize: THREE.IUniform<number>
        treeBlockOffset: THREE.IUniform<number>
        treeBlockSize: THREE.IUniform<number>
    }

    constructor(parameters: FoldLineMaterialParameters = {}) {
        const params = structuredClone(parameters)
        delete params.treeData
        delete params.treeDataSize
        delete params.foldDistance
        delete params.foldSize
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
            foldDistance: {
                value: parameters.foldDistance ?? 1.1,
            },
            foldSize: {
                value: parameters.foldSize ?? 1.1,
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

        Object.defineProperty(this, "foldDistance", {
            get: () => this.uniforms.foldDistance.value,
            set: (value: number) => {
                this.uniforms.foldDistance.value = value
            },
        })

        Object.defineProperty(this, "foldSize", {
            get: () => this.uniforms.foldSize.value,
            set: (value: number) => {
                this.uniforms.foldSize.value = value
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
                    "#include <tree_funcitons>\n" +
                    "#include <uniform_fold>\n"
            )
            shader.vertexShader = shader.vertexShader.replace(
                "void main() {",
                "void main() {\n\t#include <tree_main>"
            )

            shader.vertexShader = shader.vertexShader.replace(
                "#include <begin_vertex>",
                "#include <begin_vertex>" +
                    /* glsl */ `
                vec4 parentNodeData = vec4(0.);
                mat4 parentNodeMatrix = mat4(1.0);
                readTreeData(parentSlot, parentNodeMatrix, parentNodeData);

                // extract matrix info
                vec2 childPos = nodeMatrix[3].xz; 
                vec2 parentPos = parentNodeMatrix[3].xz; 
                vec2 delta = parentPos - childPos;
                vec2 lineDirection = normalize(length(delta) > 0.0 ? delta : vec2(1.0, 0.0));
                vec2 lineNormal = lineDirection.yx * vec2(-1.,1.);
                float halfNodeDistance = distance(childPos, parentPos)/2.0;

				// constrain fold line when nodes are close
				float adjFoldDistance = foldDistance;
				if (adjFoldDistance > halfNodeDistance){
					adjFoldDistance = halfNodeDistance;
				}	

                lineDirection *= adjFoldDistance;
                lineNormal *= foldSize/2.0;

                int id = gl_VertexID % 4;
                if(id == 0){
                    transformed.xz = childPos + lineDirection + lineNormal;
                }else if (id == 1){
                    transformed.xz = childPos + lineDirection - lineNormal;
                }else if (id == 2){
                    transformed.xz = parentPos - lineDirection + lineNormal;
                }else if (id == 3){
                    transformed.xz = parentPos - lineDirection - lineNormal;
                    
                }
                
                transformed.y = 10.0;
                `
            )
        }
    }
}

declare module "three" {
    interface LineBasicMaterial {
        treeData?: THREE.DataTexture | null
        treeDataSize?: number
        foldDistance?: number
        foldSize?: number
        treeBlockOffset?: number
        treeBlockSize?: number
    }
}
