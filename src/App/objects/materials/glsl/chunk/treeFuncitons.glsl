ivec2 getTreeDataTexelCoord(int texelIndex) {
    return ivec2(texelIndex % treeDataSize, texelIndex / treeDataSize);
}

vec4 readTreeDataTexel(int texelIndex) {
    return texelFetch(treeData, getTreeDataTexelCoord(texelIndex), 0).rgba;
}

void readTreeData(int slot, out mat4 matrix, out vec4 metadata) {
    int texelIndex = slot * 5;
    vec4 row0 = readTreeDataTexel(texelIndex + 0);
    vec4 row1 = readTreeDataTexel(texelIndex + 1);
    vec4 row2 = readTreeDataTexel(texelIndex + 2);
    vec4 row3 = readTreeDataTexel(texelIndex + 3);
    metadata = readTreeDataTexel(texelIndex + 4);
    matrix = mat4(row0, row1, row2, row3);
}