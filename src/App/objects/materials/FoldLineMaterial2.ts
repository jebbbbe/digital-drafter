import { InstancedLineMaterial } from "./InstancedLineMaterial"
import type { CustomLineMaterialParameters } from "./InstancedLineMaterial"

type FoldLineMaterial2Parameters = CustomLineMaterialParameters & {
    foldDistance?: number
    foldSize?: number
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

        this.vertexShader = this.vertexShader.replace(
            /*glsl */ `return mat4( column0, column1, column2, column3 );

			}

		#endif`,
            /*glsl */ `return mat4( column0, column1, column2, column3 );

			}

			vec4 readSlotMetadata( const in int slotIndex ) {

				int texelIndex = slotIndex * 5;
				return readTreeDataTexel( texelIndex + 4 );

			}

			mat4 readMatrixAtSlot( const in int slotIndex ) {

				int texelIndex = slotIndex * 5;

				vec4 column0 = readTreeDataTexel( texelIndex + 0 );
				vec4 column1 = readTreeDataTexel( texelIndex + 1 );
				vec4 column2 = readTreeDataTexel( texelIndex + 2 );
				vec4 column3 = readTreeDataTexel( texelIndex + 3 );

				return mat4( column0, column1, column2, column3 );

			}

		#endif`
        )

        this.vertexShader = this.vertexShader.replace(
            /*glsl */ `uniform int instanceMatrixCount;`,
            /*glsl */ `uniform int instanceMatrixCount;
			uniform float foldDistance;
			uniform float foldSize;`
        )

        this.vertexShader = this.vertexShader.replace(
            /*glsl */ `				int matrixIndex = gl_InstanceID % instanceMatrixCount;
				mat4 lineMatrix = readInstanceMatrix( matrixIndex );
				nodeScale = length( lineMatrix[ 0 ].xyz );
				lineStart = ( lineMatrix * vec4( lineStart, 1.0 ) ).xyz;
				lineEnd = ( lineMatrix * vec4( lineEnd, 1.0 ) ).xyz;`,
            /*glsl */ `				int matrixIndex = gl_InstanceID % instanceMatrixCount;
				int segmentIndex = gl_InstanceID / instanceMatrixCount;
				int slotIndex = treeBlockOffset * treeBlockSize + matrixIndex;
				mat4 lineMatrix = readMatrixAtSlot( slotIndex );
				vec4 lineMetadata = readSlotMetadata( slotIndex );
				mat4 parentLineMatrix = readMatrixAtSlot( int( lineMetadata.x ) );
				nodeScale = length( lineMatrix[ 0 ].xyz );

				vec2 childPos = lineMatrix[ 3 ].xz;
				vec2 parentPos = parentLineMatrix[ 3 ].xz;
				vec2 delta = parentPos - childPos;
				float deltaLength = length( delta );
				vec2 foldDir = deltaLength > 0.0 ? delta / deltaLength : vec2( 1.0, 0.0 );
				vec2 foldNorm = foldDir.yx * vec2( -1.0, 1.0 );
				float adjFoldDistance = min( foldDistance, deltaLength * 0.5 );

				foldDir *= adjFoldDistance;
				foldNorm *= foldSize * 0.5;

				if ( segmentIndex == 0 ) {

					vec2 startXZ = childPos + foldDir + foldNorm;
					vec2 endXZ = childPos + foldDir - foldNorm;
					lineStart = vec3( startXZ.x, 10.0, startXZ.y );
					lineEnd = vec3( endXZ.x, 10.0, endXZ.y );

				} else {

					vec2 startXZ = parentPos - foldDir + foldNorm;
					vec2 endXZ = parentPos - foldDir - foldNorm;
					lineStart = vec3( startXZ.x, 10.0, startXZ.y );
					lineEnd = vec3( endXZ.x, 10.0, endXZ.y );

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
}
