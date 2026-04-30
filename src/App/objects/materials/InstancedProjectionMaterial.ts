import * as THREE from "three"

type InstancedProjectionMaterialParameters =
    THREE.LineBasicMaterialParameters & {
        instanceMatrixTexture?: THREE.DataTexture | null
    }

/**
 * Instanced line material with random-access matrix reads from a `DataTexture`.
 *
 * The material extends `THREE.LineBasicMaterial` and adds one custom uniform,
 * `instanceMatrixTexture`, which should contain one matrix per row packed into
 * four RGBA float texels. The shader uses `gl_InstanceID` to fetch the current
 * instance matrix and a `lookupIndex` instanced attribute to fetch a second,
 * arbitrary instance matrix.
 *
 * Geometry requirements:
 * - `lookupIndex`: `THREE.InstancedBufferAttribute` with one float per instance.
 *
 * Runtime requirements:
 * - WebGL2 / GLSL3 features, since the shader uses `texelFetch` and
 *   `gl_InstanceID`.
 *
 * Example:
 * ```ts
 * const material = new InstancedProjectionMaterial()
 * material.instanceMatrixTexture = matrixTexture
 * ```
 */
export class InstancedProjectionMaterial extends THREE.LineBasicMaterial {
    shader?: THREE.WebGLProgramParametersWithUniforms
    customUniforms: {
        instanceMatrixTexture: { value: THREE.DataTexture | null }
    }

    constructor(parameters: InstancedProjectionMaterialParameters = {}) {
        const params = structuredClone(parameters)
        delete params.instanceMatrixTexture
        super(params)

        this.customUniforms = {
            instanceMatrixTexture: {
                value: parameters.instanceMatrixTexture ?? null,
            },
        }

        Object.defineProperty(this, "instanceMatrixTexture", {
            get: () => this.customUniforms.instanceMatrixTexture.value,
            set: (value: THREE.DataTexture | null) => {
                this.customUniforms.instanceMatrixTexture.value = value
                if (this.shader) {
                    this.shader.uniforms.instanceMatrixTexture.value = value
                }
            },
        })

        this.onBeforeCompile = (shader) => {
            shader.uniforms = {
                ...shader.uniforms,
                ...this.customUniforms,
            }

            shader.vertexShader = shader.vertexShader.replace(
                "#include <common>",
                /* glsl */ `
                #include <common>
                attribute float lookupIndex;
                uniform sampler2D instanceMatrixTexture;

                varying float vLookupIndex;

                mat4 loadInstanceMatrix(sampler2D tex, int matrixIndex) {
                    vec4 c0 = texelFetch(tex, ivec2(0, matrixIndex), 0);
                    vec4 c1 = texelFetch(tex, ivec2(1, matrixIndex), 0);
                    vec4 c2 = texelFetch(tex, ivec2(2, matrixIndex), 0);
                    vec4 c3 = texelFetch(tex, ivec2(3, matrixIndex), 0);
                    return mat4(c0, c1, c2, c3);
                }
                `
            )

            shader.vertexShader = shader.vertexShader.replace(
                "#include <begin_vertex>",
                /* glsl */ `
                #include <begin_vertex>

                vLookupIndex = lookupIndex;

                int currentIndex = gl_InstanceID;
                int parentIndex = int(lookupIndex);

                mat4 currentMatrix = loadInstanceMatrix(instanceMatrixTexture, currentIndex);
                mat4 otherMatrix = loadInstanceMatrix(instanceMatrixTexture, parentIndex);

                vec3 currentPosition = (currentMatrix * vec4(transformed, 1.0)).xyz;
                vec3 otherOffset = (otherMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;

                transformed = currentPosition;
                transformed.y += otherOffset.x * 0.1;
                `
            )

            shader.fragmentShader = shader.fragmentShader.replace(
                "#include <common>",
                /* glsl */ `
                #include <common>
                varying float vLookupIndex;
                `
            )

            shader.fragmentShader = shader.fragmentShader.replace(
                "vec4 diffuseColor = vec4( diffuse, opacity );",
                /* glsl */ `
                vec4 diffuseColor = vec4(diffuse, opacity);
                diffuseColor.rgb *= vec3(0.5 + vLookupIndex / 4.0, 0.8, 0.7);
                `
            )

            this.shader = shader
        }
    }
}

declare module "three" {
    interface LineBasicMaterial {
        instanceMatrixTexture?: THREE.DataTexture | null
    }
}
