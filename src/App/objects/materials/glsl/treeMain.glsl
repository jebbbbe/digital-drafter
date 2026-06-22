vec4 nodeData = vec4(0.);
mat4 nodeMatrix = mat4(1.0);

int matrixIndex = gl_InstanceID;
int slotIndex = treeBlockOffset * treeBlockSize + matrixIndex;

readTreeData(slotIndex, nodeMatrix, nodeData);
int parentSlot = int(nodeData.x);