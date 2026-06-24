import * as THREE from "three"
import { InstancedLineMaterial } from "./InstancedLineMaterial"
import type { CustomLineMaterialParameters } from "./InstancedLineMaterial"

type FoldLineMaterial2Parameters = CustomLineMaterialParameters & {
    foldDistance?: number
    foldSize?: number
    boundingEdge?: number
    anchor?: THREE.Vector3
}

type FoldLineMaterial2Uniforms = InstancedLineMaterial["uniforms"] & {
    foldDistance: THREE.IUniform<number>
    foldSize: THREE.IUniform<number>
    boundingEdge: THREE.IUniform<number>
    anchor: THREE.IUniform<THREE.Vector3>
}

export class FoldLineMaterial2 extends InstancedLineMaterial {
    declare uniforms: FoldLineMaterial2Uniforms

    constructor(parameters: FoldLineMaterial2Parameters = {}) {
        const {
            foldDistance,
            foldSize,
            boundingEdge,
            anchor,
            ...baseParameters
        } = parameters

        super(baseParameters)
        this.uniforms.foldDistance = {
            value: foldDistance ?? 1.1,
        }
        this.uniforms.foldSize = {
            value: foldSize ?? 1.1,
        }
        this.uniforms.boundingEdge = {
            value: boundingEdge ?? 1,
        }
        this.uniforms.anchor = {
            value: anchor ?? new THREE.Vector3(),
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
				vec2 lineOffset = vec2( 0.0, 0.0 );
				float halfNodeDistance = distance( childPos, parentPos ) / 2.0;

				// calc transformed bbox size
                vec3 scaleTransformed = (nodeMatrix * vec4( boundingEdge ,0. ,0. , 1.0 )).xyz;
                vec3 originTransformed = (nodeMatrix * vec4( 0. ,0. ,0. , 1.0 )).xyz;
				float boundingScale = distance(scaleTransformed, originTransformed);
				boundingScale = max(boundingScale, 0.25);

				// get anchor
				vec2 transformedAnchorOffset = (nodeMatrix * vec4( anchor, 0.0 )).xz;
				float anchorDistance = dot( transformedAnchorOffset, lineNormal );
				lineOffset = lineNormal * anchorDistance;

				// constrain fold line when nodes are close
				float adjFoldDistance = foldDistance;
				// adjFoldDistance *= max(boundingScale, 0.5);
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

				lineStart.xz += lineOffset;
				lineEnd.xz += lineOffset;

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
        return this.uniforms.foldDistance.value
    }

    set foldDistance(value: number) {
        this.uniforms.foldDistance.value = value
    }

    get foldSize(): number {
        return this.uniforms.foldSize.value
    }

    set foldSize(value: number) {
        this.uniforms.foldSize.value = value
    }

    get boundingEdge(): number {
        return this.uniforms.boundingEdge.value
    }

    set boundingEdge(value: number) {
        this.uniforms.boundingEdge.value = value
    }

    get anchor(): THREE.Vector3 {
        return this.uniforms.anchor.value
    }

    set anchor(value: THREE.Vector3) {
        this.uniforms.anchor.value.copy(value)
    }
}
