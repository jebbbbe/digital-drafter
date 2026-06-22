vec4 nodeData = vec4(0.);
mat4 nodeMatrix = mat4(1.0);
// int slotIndex = int(nodeSlot);

// int matrixIndex = gl_InstanceID % instanceMatrixCount;
int matrixIndex = gl_InstanceID;
int slotIndex = treeBlockOffset * treeBlockSize + matrixIndex;

readTreeData(slotIndex, nodeMatrix, nodeData);
int parentSlot = int(nodeData.x);