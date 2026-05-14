vec4 metadata = vec4(0.);
mat4 nodeMatrix = mat4(1.0);
readTreeData(int(nodeSlot), nodeMatrix, metadata);
int parentSlot = int(metadata.x);