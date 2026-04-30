import * as THREE from "three"

/*
when porting the projection material to an instance this seemed like the best solution, 
make the instanceMatrix buffer all indentiy matrixes.
pass the real instanceMatrix in as a dat atexture, this will let us do random reads to get the parent.
it was possible to use a sliding window approach to get attibuteID and attibuteID+1, but that doesnt work for out tree setup.
the datatexture array format can match the other instanceMatrix we are using/ updating and it will match all out updates to it. 


*/

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
 * instance matrix and a `lookupIndex` instanced attribute to fetch a second
 * matrix for the paired line endpoint. The input line geometry is expected to
 * have a doubled position buffer so alternating vertices can become the start
 * and end points of each projected segment.
 *
 * Geometry requirements:
 * - `lookupIndex`: `THREE.InstancedBufferAttribute` with one float per instance.
 *
 * Runtime requirements:
 * - WebGL2 / GLSL3 features, since the shader uses `texelFetch` and
 *   `gl_InstanceID`.
 *
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
                int parentIndex = int(lookupIndex);
                if ( gl_VertexID % 2 == 0) {
                    // mat4 startMatrix = instanceMatrix;
                    // instanceMatrix must be set to identity, otherwise we will be double transforming all our verts. 
                    mat4 startMatrix = loadInstanceMatrix(instanceMatrixTexture, gl_InstanceID);
                    transformed = (startMatrix * vec4(transformed, 1.0)).xyz;
                } else {
                    mat4 endMatrix = loadInstanceMatrix(instanceMatrixTexture, parentIndex);
                    transformed = (endMatrix * vec4(transformed, 1.0)).xyz;
                }
                // we can probably do some normal checking or raycasting here...
                transformed.y = -5.0;
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
