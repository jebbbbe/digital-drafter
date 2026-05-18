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
    capStyle?: number
}

export const CAP_STYLE = {
    none: 0,
    square: 1,
    round: 2,
} as const

const vertexShader =
    "#include <common>\n" +
    /* glsl */ `
uniform float linewidth;
uniform vec2 resolution;
uniform highp sampler2D segments;
uniform float capStyle;
    
#ifdef USE_CIRCLE_CAP
out vec2 vCapCoord;
out float vCapSize;
#endif

varying vec4 nodeData;

vec3 readPoint(int pointIndex) {
    return texelFetch(segments, ivec2(pointIndex, 0), 0).rgb;
}

void main() {

    nodeData = metadata;

    int corner = gl_VertexID % 4;
    int segmentIndex = gl_VertexID / 4;
    float along = float(corner / 2);
    float side = mod(float(corner), 2.0) * 2.0 - 1.0;

    int pointIndex = segmentIndex * 2;
    vec3 aStart = readPoint(pointIndex + 0);
    vec3 aEnd = readPoint(pointIndex + 1);

    #ifdef USE_INSTANCING
    aStart = (instanceMatrix * vec4(aStart, 1.0)).xyz;
    aEnd = (instanceMatrix * vec4(aEnd, 1.0)).xyz;
    #endif

    vec4 clipStart = projectionMatrix * modelViewMatrix * vec4(aStart, 1.0);
    vec4 clipEnd = projectionMatrix * modelViewMatrix * vec4(aEnd, 1.0);

    vec2 ndcStart = clipStart.xy / clipStart.w;
    vec2 ndcEnd = clipEnd.xy / clipEnd.w;

    vec2 dir = normalize(ndcEnd - ndcStart);
    vec2 normal = vec2(dir.y, -dir.x);
    vec4 clip = mix(clipStart, clipEnd, along);
    float capSide = along * 2.0 - 1.0;
    float capOffset = step(0.5, capStyle);
    vec2 offset = (normal * side + dir * capSide * capOffset) * linewidth / resolution.y;

    #ifdef USE_CIRCLE_CAP
    float segmentLength = length((ndcEnd - ndcStart) * resolution.y);
    vCapCoord = vec2(along, side);
    vCapSize = capOffset > 0.0
        ? min(linewidth / max(segmentLength + 2.0 * linewidth, 0.0001), 0.5)
        : 0.0;
    #endif

    clip.xy += offset * clip.w;
    gl_Position = clip;
}
`

const fragmentShader = /* glsl */ `
uniform vec3 color;
uniform float capStyle;

#ifdef USE_CIRCLE_CAP
in vec2 vCapCoord;
in float vCapSize;
#endif

out vec4 outColor;

varying vec4 nodeData;


void main() {
    #ifdef USE_CIRCLE_CAP
    if (capStyle > 1.5 && vCapSize > 0.0) {
        if (vCapCoord.x < vCapSize) {
            vec2 startCapUv = vec2((vCapCoord.x - vCapSize) / vCapSize, vCapCoord.y);
            if (dot(startCapUv, startCapUv) > 1.0) discard;
        } else if (vCapCoord.x > 1.0 - vCapSize) {
            vec2 endCapUv = vec2((vCapCoord.x - (1.0 - vCapSize)) / vCapSize, vCapCoord.y);
            if (dot(endCapUv, endCapUv) > 1.0) discard;
        }
    }
    #endif

    outColor = vec4(color, 1.0);

    if(nodeData.y == 1.){
        outColor.xyz = vec3(0.9,0.9,0.0);
    }
}
`

;(UniformsLib as any).dataTextureLine = {
    linewidth: { value: 1 },
    resolution: { value: new Vector2(1, 1) },
    color: { value: new Color(0xffffff) },
    segments: { value: null },
    capStyle: { value: CAP_STYLE.square },
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

        this.type = "DataTextureLineMaterial"

        this.setValues(parameters)
        this.capStyle = parameters.capStyle ?? CAP_STYLE.square
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
        return this.uniforms.color.value as Color
    }

    set color(value: ColorRepresentation) {
        this.uniforms.color.value.set(value)
    }

    get segments() {
        return this.uniforms.segments.value as DataTexture | null
    }

    set segments(value: DataTexture | null) {
        this.uniforms.segments.value = value
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
