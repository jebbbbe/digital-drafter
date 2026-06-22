
int matrixIndex = gl_InstanceID % instanceMatrixCount;
int slotIndex = treeBlockOffset * treeBlockSize + matrixIndex;
vec4 nodeData = vec4( 0.0 );
mat4 nodeMatrix = mat4( 1.0 );
readTreeData( slotIndex, nodeMatrix, nodeData );

_nodeData = nodeData;

lineStart = ( nodeMatrix * vec4( lineStart, 1.0 ) ).xyz;
lineEnd = ( nodeMatrix * vec4( lineEnd, 1.0 ) ).xyz;

nodeScale = length( nodeMatrix[ 0 ].xyz );
