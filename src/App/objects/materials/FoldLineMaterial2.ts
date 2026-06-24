import { InstancedLineMaterial } from "./InstancedLineMaterial"
import type { CustomLineMaterialParameters } from "./InstancedLineMaterial"

type FoldLineMaterial2Parameters = CustomLineMaterialParameters & {
    foldDistance?: number
    foldSize?: number
    boundingEdge?: number
}

export class FoldLineMaterial2 extends InstancedLineMaterial {
    constructor(parameters: FoldLineMaterial2Parameters = {}) {
        const baseParameters = { ...parameters }
        delete baseParameters.foldDistance
        delete baseParameters.foldSize

        super(baseParameters)
        ;(this.uniforms as any).foldDistance = {
            value: parameters.foldDistance ?? 1.1,
        }
        ;(this.uniforms as any).foldSize = {
            value: parameters.foldSize ?? 1.1,
        }
        ;(this.uniforms as any).boundingEdge = {
            value: parameters.boundingEdge ?? 1,
        }

        this.vertexShader = this.vertexShader.replace(
            `#include <tree_funcitons>`,
            `#include <tree_funcitons>\n` + "#include <uniform_fold>\n"
        )

        this.vertexShader = this.vertexShader.replace(
            "#include <instanced_line>",
            /*glsl */ `
				int matrixIndex = gl_InstanceID % instanceMatrixCount;
				int slotIndex = treeBlockOffset * treeBlockSize + matrixIndex;

				vec4 nodeData = vec4( 0.0 );
				mat4 nodeMatrix = mat4( 1.0 );
				readTreeData( slotIndex, nodeMatrix, nodeData );
				int parentSlot = int(nodeData.x);

				vec4 parentNodeData = vec4( 0.0 );
				mat4 parentNodeMatrix = mat4( 1.0 );
				readTreeData( parentSlot, parentNodeMatrix, parentNodeData );
				
				// extract matrix info
				vec2 childPos = nodeMatrix[ 3 ].xz;
				vec2 parentPos = parentNodeMatrix[ 3 ].xz;
				vec2 delta = parentPos - childPos;
				float deltaLength = length( delta );
				vec2 lineDirection = deltaLength > 0.0 ? normalize( delta ) : vec2( 0.0, 0.0 );
				vec2 lineNormal = lineDirection.yx * vec2( -1., 1. );
				float halfNodeDistance = distance( childPos, parentPos ) / 2.0;

				// calc transformed bbox size
                vec3 scaleTransformed = (nodeMatrix * vec4( boundingEdge ,0. ,0. , 1.0 )).xyz;
                vec3 originTransformed = (nodeMatrix * vec4( 0. ,0. ,0. , 1.0 )).xyz;
				float boundingScale = distance(scaleTransformed, originTransformed);

				// constrain fold line when nodes are close
				float adjFoldDistance = foldDistance;
				adjFoldDistance *= boundingScale;
				if ( adjFoldDistance > halfNodeDistance ) {
					adjFoldDistance = halfNodeDistance;
				}
				bool banish = deltaLength <= boundingScale;

				lineDirection *= adjFoldDistance;
				lineNormal *= foldSize / 2.0;
				lineNormal *= boundingScale;

				int id = gl_InstanceID / instanceMatrixCount;
				if ( id == 0 ) {
					lineStart.xz = childPos + lineDirection + lineNormal;
					lineEnd.xz = childPos + lineDirection - lineNormal;
				} else {
					lineStart.xz = parentPos - lineDirection + lineNormal;
					lineEnd.xz = parentPos - lineDirection - lineNormal;

				}

				lineStart.y = 10.0;
				lineEnd.y = 10.0;
				
				// hide lines if to close
				if( banish ){
					lineStart = vec3( 10000.0, -10000.0, 10000.0 );
					lineEnd = vec3( 10001.0, -10000.0, 10000.0 );
				}`
        )
    }

    get foldDistance(): number {
        return (this.uniforms as any).foldDistance?.value ?? 1.1
    }

    set foldDistance(value: number) {
        if ((this.uniforms as any).foldDistance) {
            ;(this.uniforms as any).foldDistance.value = value
            return
        }

        ;(this.uniforms as any).foldDistance = { value }
    }

    get foldSize(): number {
        return (this.uniforms as any).foldSize?.value ?? 1.1
    }

    set foldSize(value: number) {
        if ((this.uniforms as any).foldSize) {
            ;(this.uniforms as any).foldSize.value = value
            return
        }

        ;(this.uniforms as any).foldSize = { value }
    }

    get boundingEdge(): number {
        return (this.uniforms as any).boundingEdge?.value ?? 1
    }

    set boundingEdge(value: number) {
        if ((this.uniforms as any).boundingEdge) {
            ;(this.uniforms as any).boundingEdge.value = value
            return
        }

        ;(this.uniforms as any).boundingEdge = { value }
    }
}
