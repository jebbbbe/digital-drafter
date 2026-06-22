vec4 nodeData = vec4(0.);
mat4 nodeMatrix = mat4(1.0);
readTreeData(int(nodeSlot), nodeMatrix, nodeData);
int parentSlot = int(nodeData.x);