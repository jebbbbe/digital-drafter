import * as THREE from "three"

export type DataTextureLineMaterialParameters =
    THREE.ShaderMaterialParameters & {
        thickness?: number
        resolution?: THREE.Vector2
        color?: THREE.ColorRepresentation
        segments?: THREE.DataTexture | null
    }

const vertexShader = /* glsl */ `
uniform float uThickness;
uniform vec2 uResolution;
uniform highp sampler2D uSegments;

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
    vec2 offset = normal * side * uThickness / uResolution.y;

    clip.xy += offset * clip.w;
    gl_Position = clip;
}
`

const fragmentShader = /* glsl */ `
uniform vec3 uColor;

out vec4 outColor;

void main() {
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
            uniforms,
            ...shaderParameters
        } = parameters

        super({
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
                ...uniforms,
            },
        })
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
}
