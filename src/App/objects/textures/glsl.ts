const attribute = /* glsl */ `
uniform highp sampler2D nodeData;
uniform int nodeDataSize;
`
const dataTextureRead = /* glsl */ `
ivec2 getNodeDataTexelCoord(int texelIndex) {
    return ivec2(texelIndex % nodeDataSize, texelIndex / nodeDataSize);
}

vec4 readNodeDataTexel(int texelIndex) {
    return texelFetch(nodeData, getNodeDataTexelCoord(texelIndex), 0).rgba;
}

void readNodeData(int slot, out mat4 matrix, out vec4 metadata) {
    int texelIndex = slot * 5;
    vec4 row0 = readNodeDataTexel(texelIndex + 0);
    vec4 row1 = readNodeDataTexel(texelIndex + 1);
    vec4 row2 = readNodeDataTexel(texelIndex + 2);
    vec4 row3 = readNodeDataTexel(texelIndex + 3);
    metadata = readNodeDataTexel(texelIndex + 4);
    matrix = mat4(row0, row1, row2, row3);
}
`

export const glslChunks = {
    attribute: attribute,
    read: dataTextureRead,
}
