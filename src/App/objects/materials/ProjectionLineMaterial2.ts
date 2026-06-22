import { InstancedLineMaterial } from "./InstancedLineMaterial"
import type { CustomLineMaterialParameters } from "./InstancedLineMaterial"

type ProjectionLineMaterial2Parameters = CustomLineMaterialParameters

export class ProjectionLineMaterial2 extends InstancedLineMaterial {
    constructor(parameters: ProjectionLineMaterial2Parameters = {}) {
        super(parameters)

        this.vertexShader = this.vertexShader.replace(
            "#include <instanced_line>",
            /* glsl */ `
			int matrixIndex = gl_InstanceID % instanceMatrixCount;
			int slotIndex = treeBlockOffset * treeBlockSize + matrixIndex;
				
			vec4 nodeData = vec4( 0.0 );
			mat4 nodeMatrix = mat4( 1.0 );
			readTreeData( slotIndex, nodeMatrix, nodeData );
			int parentSlot = int(nodeData.x);

			vec4 parentNodeData = vec4( 0.0 );
			mat4 parentNodeMatrix = mat4( 1.0 );
			readTreeData( int( nodeData.x ), parentNodeMatrix, parentNodeData );
				

			vec3 childTransformed = ( nodeMatrix * vec4( lineStart, 1.0 ) ).xyz;
			vec3 parentTransformed = ( parentNodeMatrix * vec4( lineEnd, 1.0 ) ).xyz;
				
			lineStart = childTransformed;
			lineEnd = parentTransformed;

			if ( childTransformed.y > 0.0 && parentTransformed.y > 0.0 ) {
				// lineStart.y = 5.0;
				// lineEnd.y = 5.0;
			} else {
				lineStart.y = -5.0;
				lineEnd.y = -5.0;
			}`
        )
    }
}
