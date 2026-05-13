vec4 metadata = vec4(0.);
mat4 treeMatrix = mat4(1.0);
readTreeData(int(nodeSlot), treeMatrix, metadata);
int parentSlot = int(metadata.x);