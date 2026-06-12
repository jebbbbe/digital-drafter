import {
    DataTexture,
    GLSL3,
    ShaderLib,
    ShaderMaterial,
    UniformsLib,
    UniformsUtils,
    Vector2,
    type Color,
    type ColorRepresentation,
    type ShaderMaterialParameters,
} from "three"

export type MatrixTextureLineMaterialParameters = ShaderMaterialParameters & {
    worldUnits?: boolean
    linewidth?: number
    resolution?: Vector2
    dashed?: boolean
    dashScale?: number
    dashSize?: number
    dashOffset?: number
    gapSize?: number
    alphaToCoverage?: boolean
    color?: ColorRepresentation
    instanceMatrices?: DataTexture | null
    instanceMatrixCount?: number
}

;(UniformsLib as any).matrixTextureLine = {
    worldUnits: { value: 1 },
    linewidth: { value: 1 },
    resolution: { value: new Vector2(1, 1) },
    dashOffset: { value: 0 },
    dashScale: { value: 1 },
    dashSize: { value: 1 },
    gapSize: { value: 1 },
    instanceMatrices: { value: null },
    instanceMatrixCount: { value: 1 },
}

ShaderLib["matrixTextureLine"] = {
    uniforms: UniformsUtils.merge([
        UniformsLib.common,
        UniformsLib.fog,
        (UniformsLib as any).matrixTextureLine,
    ]),

    vertexShader: /* glsl */ `
		#include <common>
		#include <color_pars_vertex>
		#include <fog_pars_vertex>
		#include <logdepthbuf_pars_vertex>
		#include <clipping_planes_pars_vertex>

		uniform float linewidth;
		uniform vec2 resolution;
		uniform highp sampler2D instanceMatrices;
		uniform int instanceMatrixCount;

		attribute vec3 instanceStart;
		attribute vec3 instanceEnd;

		attribute vec3 instanceColorStart;
		attribute vec3 instanceColorEnd;

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

		#ifdef USE_DASH

			uniform float dashScale;
			attribute float instanceDistanceStart;
			attribute float instanceDistanceEnd;
			varying float vLineDistance;

		#endif

		mat4 readInstanceMatrix( const in int matrixIndex ) {

			vec4 column0 = texelFetch( instanceMatrices, ivec2( 0, matrixIndex ), 0 );
			vec4 column1 = texelFetch( instanceMatrices, ivec2( 1, matrixIndex ), 0 );
			vec4 column2 = texelFetch( instanceMatrices, ivec2( 2, matrixIndex ), 0 );
			vec4 column3 = texelFetch( instanceMatrices, ivec2( 3, matrixIndex ), 0 );

			return mat4( column0, column1, column2, column3 );

		}

		void trimSegment( const in vec4 start, inout vec4 end ) {

			float a = projectionMatrix[ 2 ][ 2 ];
			float b = projectionMatrix[ 3 ][ 2 ];
			float nearEstimate = - 0.5 * b / a;

			float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

			end.xyz = mix( start.xyz, end.xyz, alpha );

		}

		void main() {

			#ifdef USE_COLOR

				vColor.xyz = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

			#endif

			#ifdef USE_DASH

				vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
				vUv = uv;

			#endif

			float aspect = resolution.x / resolution.y;
			int matrixIndex = gl_InstanceID % instanceMatrixCount;
			mat4 lineMatrix = readInstanceMatrix( matrixIndex );

			vec3 transformedInstanceStart = ( lineMatrix * vec4( instanceStart, 1.0 ) ).xyz;
			vec3 transformedInstanceEnd = ( lineMatrix * vec4( instanceEnd, 1.0 ) ).xyz;

			vec4 start = modelViewMatrix * vec4( transformedInstanceStart, 1.0 );
			vec4 end = modelViewMatrix * vec4( transformedInstanceEnd, 1.0 );

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
		`,

    fragmentShader: /* glsl */ `
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

		out highp vec4 pc_fragColor;
		#define gl_FragColor pc_fragColor

		#include <common>
		#include <color_pars_fragment>
		#include <fog_pars_fragment>
		#include <logdepthbuf_pars_fragment>
		#include <clipping_planes_pars_fragment>

		vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

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

			gl_FragColor = vec4( diffuseColor.rgb, alpha );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>
			#include <fog_fragment>
			#include <premultiplied_alpha_fragment>

		}
		`,
}

class MatrixTextureLineMaterial extends ShaderMaterial {
    constructor(parameters: MatrixTextureLineMaterialParameters = {}) {
        super({
            glslVersion: GLSL3,
            uniforms: UniformsUtils.clone(
                ShaderLib["matrixTextureLine"].uniforms
            ),
            vertexShader: ShaderLib["matrixTextureLine"].vertexShader,
            fragmentShader: ShaderLib["matrixTextureLine"].fragmentShader,
            clipping: true,
        })

        ;(this as any).type = "MatrixTextureLineMaterial"
        //@ts-ignore
        this.isLineMaterial = true
        //@ts-ignore
        this.isMatrixTextureLineMaterial = true

        this.setValues(parameters)
    }

    get instanceMatrices() {
        return this.uniforms.instanceMatrices.value as DataTexture | null
    }

    set instanceMatrices(value: DataTexture | null) {
        this.uniforms.instanceMatrices.value = value
    }

    get instanceMatrixCount() {
        return this.uniforms.instanceMatrixCount.value as number
    }

    set instanceMatrixCount(value: number) {
        this.uniforms.instanceMatrixCount.value = Math.max(
            1,
            Math.floor(value)
        )
    }

    get color() {
        return this.uniforms.diffuse.value as Color
    }

    set color(value: ColorRepresentation) {
        this.uniforms.diffuse.value.set(value)
    }

    get worldUnits() {
        return "WORLD_UNITS" in this.defines
    }

    set worldUnits(value: boolean) {
        if ((value === true) !== this.worldUnits) {
            this.needsUpdate = true
        }

        if (value === true) {
            this.defines.WORLD_UNITS = ""
        } else {
            delete this.defines.WORLD_UNITS
        }
    }

    get linewidth() {
        return this.uniforms.linewidth.value as number
    }

    set linewidth(value: number) {
        if (!this.uniforms.linewidth) return
        this.uniforms.linewidth.value = value
    }

    get dashed() {
        return "USE_DASH" in this.defines
    }

    set dashed(value: boolean) {
        if ((value === true) !== this.dashed) {
            this.needsUpdate = true
        }

        if (value === true) {
            this.defines.USE_DASH = ""
        } else {
            delete this.defines.USE_DASH
        }
    }

    get dashScale() {
        return this.uniforms.dashScale.value as number
    }

    set dashScale(value: number) {
        this.uniforms.dashScale.value = value
    }

    get dashSize() {
        return this.uniforms.dashSize.value as number
    }

    set dashSize(value: number) {
        this.uniforms.dashSize.value = value
    }

    get dashOffset() {
        return this.uniforms.dashOffset.value as number
    }

    set dashOffset(value: number) {
        this.uniforms.dashOffset.value = value
    }

    get gapSize() {
        return this.uniforms.gapSize.value as number
    }

    set gapSize(value: number) {
        this.uniforms.gapSize.value = value
    }

    get opacity() {
        return this.uniforms.opacity.value as number
    }

    set opacity(value: number) {
        if (!this.uniforms || !this.uniforms.opacity) return
        this.uniforms.opacity.value = value
    }

    get resolution() {
        return this.uniforms.resolution.value as Vector2
    }

    set resolution(value: Vector2) {
        this.uniforms.resolution.value.copy(value)
    }

    get alphaToCoverage() {
        return "USE_ALPHA_TO_COVERAGE" in this.defines
    }

    set alphaToCoverage(value: boolean) {
        if (!this.defines) return

        if ((value === true) !== this.alphaToCoverage) {
            this.needsUpdate = true
        }

        if (value === true) {
            this.defines.USE_ALPHA_TO_COVERAGE = ""
        } else {
            delete this.defines.USE_ALPHA_TO_COVERAGE
        }
    }
}

export { MatrixTextureLineMaterial }
