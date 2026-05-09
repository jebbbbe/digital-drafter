import * as THREE from "three"

export type DataTextureLineMaterialParameters =
    THREE.ShaderMaterialParameters & {
        thickness?: number
        resolution?: THREE.Vector2
        color?: THREE.ColorRepresentation
        segments?: THREE.DataTexture | null
        capStyle?: number
    }

export const CAP_STYLE = {
    none: 0,
    square: 1,
    round: 2,
} as const

const vertexShader = /* glsl */ `
uniform float uThickness;
uniform vec2 uResolution;
uniform highp sampler2D uSegments;
uniform float uCapStyle;

#ifdef USE_DASH
out vec2 vCapCoord;
out float vCapSize;
#endif

vec3 readPoint(int pointIndex) {
    return texelFetch(uSegments, ivec2(pointIndex, 0), 0).rgb;
}

void main() {
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
    vec2 normal = vec2(-dir.y, dir.x);
    vec4 clip = mix(clipStart, clipEnd, along);
    float capSide = along * 2.0 - 1.0;
    float capOffset = step(0.5, uCapStyle);
    vec2 offset = (normal * side + dir * capSide * capOffset) * uThickness / uResolution.y;

    #ifdef USE_DASH
    float segmentLength = length((ndcEnd - ndcStart) * uResolution.y);
    vCapCoord = vec2(along, side);
    vCapSize = capOffset > 0.0
        ? min(uThickness / max(segmentLength + 2.0 * uThickness, 0.0001), 0.5)
        : 0.0;
    #endif

    clip.xy += offset * clip.w;
    gl_Position = clip;
}
`

const fragmentShader = /* glsl */ `
uniform vec3 uColor;
uniform float uCapStyle;

#ifdef USE_DASH
in vec2 vCapCoord;
in float vCapSize;
#endif

out vec4 outColor;

void main() {
    #ifdef USE_DASH
    if (uCapStyle > 1.5 && vCapSize > 0.0) {
        if (vCapCoord.x < vCapSize) {
            vec2 startCapUv = vec2((vCapCoord.x - vCapSize) / vCapSize, vCapCoord.y);
            if (dot(startCapUv, startCapUv) > 1.0) discard;
        } else if (vCapCoord.x > 1.0 - vCapSize) {
            vec2 endCapUv = vec2((vCapCoord.x - (1.0 - vCapSize)) / vCapSize, vCapCoord.y);
            if (dot(endCapUv, endCapUv) > 1.0) discard;
        }
    }
    #endif

    outColor = vec4(uColor, 1.0);
}
`

export class DataTextureLineMaterial extends THREE.ShaderMaterial {
    constructor(parameters: DataTextureLineMaterialParameters = {}) {
        const {
            thickness = 1,
            resolution = new THREE.Vector2(1, 1),
            color = 0xffffff,
            segments = null,
            capStyle = CAP_STYLE.square,
            uniforms,
            ...shaderParameters
        } = parameters

        super({
            // type: 'DataTextureLineMaterial',
            glslVersion: THREE.GLSL3,
            vertexShader,
            fragmentShader,
            side: THREE.DoubleSide,
            ...shaderParameters,
            uniforms: {
                uThickness: { value: thickness },
                uResolution: { value: resolution.clone() },
                uColor: { value: new THREE.Color(color) },
                uSegments: { value: segments },
                uCapStyle: { value: capStyle },
                ...uniforms,
            },
        })

        this.dashed = capStyle === CAP_STYLE.round
    }

    get thickness() {
        return this.uniforms.uThickness.value as number
    }

    set thickness(value: number) {
        this.uniforms.uThickness.value = value
    }

    get resolution() {
        return this.uniforms.uResolution.value as THREE.Vector2
    }

    set resolution(value: THREE.Vector2) {
        this.uniforms.uResolution.value.copy(value)
    }

    get color() {
        return this.uniforms.uColor.value as THREE.Color
    }

    set color(value: THREE.ColorRepresentation) {
        this.uniforms.uColor.value.set(value)
    }

    get segments() {
        return this.uniforms.uSegments.value as THREE.DataTexture | null
    }

    set segments(value: THREE.DataTexture | null) {
        this.uniforms.uSegments.value = value
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

    get capStyle() {
        return this.uniforms.uCapStyle.value as number
    }

    set capStyle(value: number) {
        this.uniforms.uCapStyle.value = value
        this.dashed = value === CAP_STYLE.round
    }
}
