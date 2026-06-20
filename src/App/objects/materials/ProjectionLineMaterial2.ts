import { InstancedLineMaterial } from "./InstancedLineMaterial"
import type { CustomLineMaterialParameters } from "./InstancedLineMaterial"

type ProjectionLineMaterial2Parameters = CustomLineMaterialParameters

export class ProjectionLineMaterial2 extends InstancedLineMaterial {
    constructor(parameters: ProjectionLineMaterial2Parameters = {}) {
        super(parameters)

        this.vertexShader = this.vertexShader.replace(
            /*glsl*/`return mat4( column0, column1, column2, column3 );

			}

		#endif`,
            /*glsl*/`return mat4( column0, column1, column2, column3 );

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
            /* glsl */ `			float aspect = resolution.x / resolution.y;
			vec3 lineStart = instanceStart;
			vec3 lineEnd = instanceEnd;
			float nodeScale = 1.0;

			#ifdef InstancedLine

				int matrixIndex = gl_InstanceID % instanceMatrixCount;
				mat4 lineMatrix = readInstanceMatrix( matrixIndex );
				nodeScale = length( lineMatrix[ 0 ].xyz );
				lineStart = ( lineMatrix * vec4( lineStart, 1.0 ) ).xyz;
				lineEnd = ( lineMatrix * vec4( lineEnd, 1.0 ) ).xyz;

			#endif`,
            /* glsl */ `			float aspect = resolution.x / resolution.y;
			vec3 lineStart = instanceStart;
			vec3 lineEnd = instanceEnd;
			float nodeScale = 1.0;

			#ifdef InstancedLine

				int matrixIndex = gl_InstanceID % instanceMatrixCount;
				int slotIndex = treeBlockOffset * treeBlockSize + matrixIndex;
				mat4 lineMatrix = readMatrixAtSlot( slotIndex );
				vec4 lineMetadata = readSlotMetadata( slotIndex );
				mat4 parentLineMatrix = readMatrixAtSlot( int( lineMetadata.x ) );
				nodeScale = length( lineMatrix[ 0 ].xyz );
				vec3 childTransformed = ( lineMatrix * vec4( lineStart, 1.0 ) ).xyz;
				vec3 parentTransformed = ( parentLineMatrix * vec4( lineEnd, 1.0 ) ).xyz;

				if ( childTransformed.y > 0.0 && parentTransformed.y > 0.0 ) {

					lineStart = childTransformed;
					lineEnd = parentTransformed;

				} else {

					lineStart = childTransformed;
					lineEnd = parentTransformed;
					lineStart.y = - 5.0;
					lineEnd.y = - 5.0;

				}

			#endif`
        )
    }
}
