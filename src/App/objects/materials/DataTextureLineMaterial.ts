import {
    Color,
    DataTexture,
    GLSL3,
    ShaderMaterial,
    ShaderLib,
    UniformsLib,
    UniformsUtils,
    Vector2,
    type ColorRepresentation,
    type ShaderMaterialParameters,
} from "three"

export type DataTextureLineMaterialParameters = ShaderMaterialParameters & {
    linewidth?: number
    resolution?: Vector2
    color?: ColorRepresentation
    segments?: DataTexture | null
    treeData?: DataTexture | null
    treeDataSize?: number
    treeBlockOffset?: number
    treeBlockSize?: number
    instanceMatrixCount?: number
    capStyle?: number
}

export const CAP_STYLE = {
    none: 0,
    square: 1,
    round: 2,
} as const

const vertexShader = /* glsl */ `
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

uniform float linewidth;
uniform vec2 resolution;
uniform highp sampler2D segments;
uniform highp sampler2D treeData;
uniform int treeDataSize;
uniform int treeBlockOffset;
uniform int treeBlockSize;
uniform int instanceMatrixCount;

#ifdef USE_DASH

uniform float dashScale;
uniform highp sampler2D segmentDistances;
varying float vLineDistance;

#endif

#ifdef WORLD_UNITS

varying vec4 worldPos;
varying vec3 worldStart;
varying vec3 worldEnd;

    #ifdef USE_DASH

    varying vec2 vUv;

    #endif

#else

varying vec2 vUv;

#endif

varying vec4 nodeData;

ivec2 getTreeDataTexelCoord( int texelIndex ) {
    return ivec2( texelIndex % treeDataSize, texelIndex / treeDataSize );
}

vec4 readTreeDataTexel( int texelIndex ) {
    return texelFetch( treeData, getTreeDataTexelCoord( texelIndex ), 0 ).rgba;
}

void readTreeData( int slot, out mat4 matrix, out vec4 metadata ) {
    int texelIndex = slot * 5;
    vec4 row0 = readTreeDataTexel( texelIndex + 0 );
    vec4 row1 = readTreeDataTexel( texelIndex + 1 );
    vec4 row2 = readTreeDataTexel( texelIndex + 2 );
    vec4 row3 = readTreeDataTexel( texelIndex + 3 );
    metadata = readTreeDataTexel( texelIndex + 4 );
    matrix = mat4( row0, row1, row2, row3 );
}

vec3 readPoint( int pointIndex ) {
    return texelFetch( segments, ivec2( pointIndex, 0 ), 0 ).rgb;
}

#ifdef USE_DASH

float readDistance( int pointIndex ) {
    return texelFetch( segmentDistances, ivec2( pointIndex, 0 ), 0 ).r;
}

#endif

void trimSegment( const in vec4 start, inout vec4 end ) {

    float a = projectionMatrix[ 2 ][ 2 ];
    float b = projectionMatrix[ 3 ][ 2 ];
    float nearEstimate = - 0.5 * b / a;

    float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

    end.xyz = mix( start.xyz, end.xyz, alpha );

}

void main() {

    int segmentIndex = gl_VertexID / 8;
    int pointIndex = segmentIndex * 2;
    int matrixIndex = gl_InstanceID % instanceMatrixCount;
    int slotIndex = treeBlockOffset * treeBlockSize + matrixIndex;
    mat4 nodeMatrix;
    vec4 metadata;
    readTreeData( slotIndex, nodeMatrix, metadata );
    nodeData = metadata;

    vec3 lineStart = ( nodeMatrix * vec4( readPoint( pointIndex + 0 ), 1.0 ) ).xyz;
    vec3 lineEnd = ( nodeMatrix * vec4( readPoint( pointIndex + 1 ), 1.0 ) ).xyz;

    #ifdef USE_COLOR

    vColor.xyz = vec3( 1.0 );

    #endif

    #ifdef USE_DASH

    float nodeScale = length( nodeMatrix[ 0 ].xyz );
    vLineDistance = ( position.y < 0.5 )
        ? dashScale * nodeScale * readDistance( pointIndex + 0 )
        : dashScale * nodeScale * readDistance( pointIndex + 1 );
    vUv = uv;

    #endif

    float aspect = resolution.x / resolution.y;

    vec4 start = modelViewMatrix * vec4( lineStart, 1.0 );
    vec4 end = modelViewMatrix * vec4( lineEnd, 1.0 );

    #ifdef WORLD_UNITS

    worldStart = start.xyz;
    worldEnd = end.xyz;

    #else

    vUv = uv;

    #endif

    bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 );

    if ( perspective ) {

        if ( start.z < 0.0 && end.z >= 0.0 ) {

            trimSegment( start, end );

        } else if ( end.z < 0.0 && start.z >= 0.0 ) {

            trimSegment( end, start );

        }

    }

    vec4 clipStart = projectionMatrix * start;
    vec4 clipEnd = projectionMatrix * end;
    vec3 ndcStart = clipStart.xyz / clipStart.w;
    vec3 ndcEnd = clipEnd.xyz / clipEnd.w;
    vec2 dir = ndcEnd.xy - ndcStart.xy;

    dir.x *= aspect;
    dir = normalize( dir );

    #ifdef WORLD_UNITS

    vec3 worldDir = normalize( end.xyz - start.xyz );
    vec3 tmpFwd = normalize( mix( start.xyz, end.xyz, 0.5 ) );
    vec3 worldUp = normalize( cross( worldDir, tmpFwd ) );
    vec3 worldFwd = cross( worldDir, worldUp );
    worldPos = position.y < 0.5 ? start : end;

    float hw = linewidth * 0.5;
    worldPos.xyz += position.x < 0.0 ? hw * worldUp : - hw * worldUp;

    #ifndef USE_DASH

    worldPos.xyz += position.y < 0.5 ? - hw * worldDir : hw * worldDir;
    worldPos.xyz += worldFwd * hw;

    if ( position.y > 1.0 || position.y < 0.0 ) {
        worldPos.xyz -= worldFwd * 2.0 * hw;
    }

    #endif

    vec4 clip = projectionMatrix * worldPos;
    vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
    clip.z = clipPose.z * clip.w;

    #else

    vec2 offset = vec2( dir.y, - dir.x );
    dir.x /= aspect;
    offset.x /= aspect;

    if ( position.x < 0.0 ) offset *= - 1.0;

    if ( position.y < 0.0 ) {
        offset += - dir;
    } else if ( position.y > 1.0 ) {
        offset += dir;
    }

    offset *= linewidth;
    offset /= resolution.y;

    vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;
    offset *= clip.w;
    clip.xy += offset;

    #endif

    gl_Position = clip;

    vec4 mvPosition = ( position.y < 0.5 ) ? start : end;

    #include <logdepthbuf_vertex>
    #include <clipping_planes_vertex>
    #include <fog_vertex>
}
`

const fragmentShader = /* glsl */ `
uniform vec3 diffuse;
uniform float opacity;
uniform float linewidth;

#ifdef USE_DASH

uniform float dashOffset;
uniform float dashSize;
uniform float gapSize;

#endif

varying float vLineDistance;

#ifdef WORLD_UNITS

varying vec4 worldPos;
varying vec3 worldStart;
varying vec3 worldEnd;

    #ifdef USE_DASH

    varying vec2 vUv;

    #endif

#else

varying vec2 vUv;

#endif

varying vec4 nodeData;

out highp vec4 pc_fragColor;
#define gl_FragColor pc_fragColor

#include <common>
#include <color_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

vec2 closestLineToLine( vec3 p1, vec3 p2, vec3 p3, vec3 p4 ) {

    float mua;
    float mub;

    vec3 p13 = p1 - p3;
    vec3 p43 = p4 - p3;
    vec3 p21 = p2 - p1;

    float d1343 = dot( p13, p43 );
    float d4321 = dot( p43, p21 );
    float d1321 = dot( p13, p21 );
    float d4343 = dot( p43, p43 );
    float d2121 = dot( p21, p21 );

    float denom = d2121 * d4343 - d4321 * d4321;
    float numer = d1343 * d4321 - d1321 * d4343;

    mua = numer / denom;
    mua = clamp( mua, 0.0, 1.0 );
    mub = ( d1343 + d4321 * ( mua ) ) / d4343;
    mub = clamp( mub, 0.0, 1.0 );

    return vec2( mua, mub );

}

void main() {

    float alpha = opacity;
    vec4 diffuseColor = vec4( diffuse, alpha );

    #include <clipping_planes_fragment>

    #ifdef USE_DASH

    if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard;
    if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard;

    #endif

    #ifdef WORLD_UNITS

    vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
    vec3 lineDir = worldEnd - worldStart;
    vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

    vec3 p1 = worldStart + lineDir * params.x;
    vec3 p2 = rayEnd * params.y;
    vec3 delta = p1 - p2;
    float len = length( delta );
    float norm = len / linewidth;

    #ifndef USE_DASH

        #ifdef USE_ALPHA_TO_COVERAGE

        float dnorm = fwidth( norm );
        alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

        #else

        if ( norm > 0.5 ) discard;

        #endif

    #endif

    #else

        #ifdef USE_ALPHA_TO_COVERAGE

        float a = vUv.x;
        float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
        float len2 = a * a + b * b;
        float dlen = fwidth( len2 );

        if ( abs( vUv.y ) > 1.0 ) {
            alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );
        }

        #else

        if ( abs( vUv.y ) > 1.0 ) {
            float a = vUv.x;
            float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
            float len2 = a * a + b * b;

            if ( len2 > 1.0 ) discard;
        }

        #endif

    #endif

    #include <logdepthbuf_fragment>
    #include <color_fragment>

    if ( nodeData.y == 1.0 ) {
        diffuseColor.rgb = vec3( 0.9, 0.9, 0.0 );
    }

    gl_FragColor = vec4( diffuseColor.rgb, alpha );

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
    #include <premultiplied_alpha_fragment>
}
`

;(UniformsLib as any).dataTextureLine = {
    linewidth: { value: 1 },
    resolution: { value: new Vector2(1, 1) },
    segments: { value: null },
    segmentDistances: { value: null },
    treeData: { value: null },
    treeDataSize: { value: 1 },
    treeBlockOffset: { value: 0 },
    treeBlockSize: { value: 1 },
    instanceMatrixCount: { value: 1 },
    capStyle: { value: CAP_STYLE.round },
}

ShaderLib["dataTextureLine"] = {
    uniforms: UniformsUtils.merge([
        UniformsLib.common,
        UniformsLib.fog,
        (UniformsLib as any).dataTextureLine,
    ]),
    vertexShader,
    fragmentShader,
}

export class DataTextureLineMaterial extends ShaderMaterial {
    constructor(parameters: DataTextureLineMaterialParameters = {}) {
        super({
            glslVersion: GLSL3,
            uniforms: UniformsUtils.clone(
                ShaderLib["dataTextureLine"].uniforms
            ),
            vertexShader: ShaderLib["dataTextureLine"].vertexShader,
            fragmentShader: ShaderLib["dataTextureLine"].fragmentShader,
            clipping: true,
        })

        ;(this as any).type = "DataTextureLineMaterial"

        this.setValues(parameters)
        this.capStyle = parameters.capStyle ?? CAP_STYLE.round
    }

    get linewidth() {
        return this.uniforms.linewidth.value as number
    }

    set linewidth(value: number) {
        if (!this.uniforms.linewidth) return
        this.uniforms.linewidth.value = value
    }

    get resolution() {
        return this.uniforms.resolution.value as Vector2
    }

    set resolution(value: Vector2) {
        this.uniforms.resolution.value.copy(value)
    }

    get color() {
        return this.uniforms.diffuse.value as Color
    }

    set color(value: ColorRepresentation) {
        this.uniforms.diffuse.value.set(value)
    }

    get segments() {
        return this.uniforms.segments.value as DataTexture | null
    }

    set segments(value: DataTexture | null) {
        this.uniforms.segments.value = value
    }

    get treeData() {
        return this.uniforms.treeData.value as DataTexture | null
    }

    set treeData(value: DataTexture | null) {
        this.uniforms.treeData.value = value
    }

    get treeDataSize() {
        return this.uniforms.treeDataSize.value as number
    }

    set treeDataSize(value: number) {
        this.uniforms.treeDataSize.value = value
    }

    get treeBlockOffset() {
        return this.uniforms.treeBlockOffset.value as number
    }

    set treeBlockOffset(value: number) {
        this.uniforms.treeBlockOffset.value = Math.max(0, Math.floor(value))
    }

    get treeBlockSize() {
        return this.uniforms.treeBlockSize.value as number
    }

    set treeBlockSize(value: number) {
        this.uniforms.treeBlockSize.value = Math.max(1, Math.floor(value))
    }

    get instanceMatrixCount() {
        return this.uniforms.instanceMatrixCount.value as number
    }

    set instanceMatrixCount(value: number) {
        this.uniforms.instanceMatrixCount.value = Math.max(1, Math.floor(value))
    }

    get dashed() {
        return "USE_DASH" in this.defines
    }

    set dashed(value) {
        if ((value === true) !== this.dashed) {
            this.needsUpdate = true
        }

        if (value === true) {
            this.defines.USE_DASH = ""
        } else {
            delete this.defines.USE_DASH
        }
    }

    private get circleCap() {
        return "USE_CIRCLE_CAP" in this.defines
    }

    private set circleCap(value) {
        if ((value === true) !== this.circleCap) {
            this.needsUpdate = true
        }

        if (value === true) {
            this.defines.USE_CIRCLE_CAP = ""
        } else {
            delete this.defines.USE_CIRCLE_CAP
        }
    }

    get capStyle() {
        return this.uniforms.capStyle.value as number
    }

    set capStyle(value: number) {
        this.uniforms.capStyle.value = value
        this.circleCap = value === CAP_STYLE.round
    }
}

declare module "three" {
    interface ShaderMaterial {
        treeData?: DataTexture | null
        treeDataSize?: number
    }
}
