import {
    GLSL3,
    ShaderLib,
    ShaderMaterial,
    UniformsLib,
    UniformsUtils,
    Vector2,
} from "three"

import type {
    Color,
    ColorRepresentation,
    ShaderMaterialParameters,
    DataTexture,
} from "three"

export type CustomLineMaterialParameters = ShaderMaterialParameters & {
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
    treeData?: DataTexture | null
    treeDataSize?: number
    treeBlockOffset?: number
    treeBlockSize?: number
    instanceMatrixCount?: number
}
;(UniformsLib as any).instanceLine = {
    worldUnits: { value: 1 },
    linewidth: { value: 1 },
    resolution: { value: new Vector2(1, 1) },
    dashOffset: { value: 0 },
    dashScale: { value: 1 },
    dashSize: { value: 1 },
    gapSize: { value: 1 }, // todo FIX - maybe change to totalSize
    treeData: { value: null },
    treeDataSize: { value: 1 },
    treeBlockOffset: { value: 0 },
    treeBlockSize: { value: 1 },
    instanceMatrixCount: { value: 1 },
}

ShaderLib["instanceLine"] = {
    uniforms: UniformsUtils.merge([
        UniformsLib.common,
        UniformsLib.fog,
        (UniformsLib as any).instanceLine,
    ]),

    vertexShader: /* glsl */ `
		#include <common>
		#include <color_pars_vertex>
		#include <fog_pars_vertex>
		#include <logdepthbuf_pars_vertex>
		#include <clipping_planes_pars_vertex>

		uniform float linewidth;
		uniform vec2 resolution;

		attribute vec3 instanceStart;
		attribute vec3 instanceEnd;

		attribute vec3 instanceColorStart;
		attribute vec3 instanceColorEnd;

		#ifdef InstancedLine

			uniform highp sampler2D treeData;
			uniform int treeDataSize;
			uniform int treeBlockOffset;
			uniform int treeBlockSize;
			uniform int instanceMatrixCount;

			ivec2 getTreeDataTexelCoord( int texelIndex ) {

				return ivec2( texelIndex % treeDataSize, texelIndex / treeDataSize );

			}

			vec4 readTreeDataTexel( int texelIndex ) {

				return texelFetch( treeData, getTreeDataTexelCoord( texelIndex ), 0 ).rgba;

			}

			mat4 readInstanceMatrix( const in int matrixIndex ) {

				int slotIndex = treeBlockOffset * treeBlockSize + matrixIndex;
				int texelIndex = slotIndex * 5;

				vec4 column0 = readTreeDataTexel( texelIndex + 0 );
				vec4 column1 = readTreeDataTexel( texelIndex + 1 );
				vec4 column2 = readTreeDataTexel( texelIndex + 2 );
				vec4 column3 = readTreeDataTexel( texelIndex + 3 );

				return mat4( column0, column1, column2, column3 );

			}

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

		#ifdef USE_DASH

			uniform float dashScale;
			attribute float instanceDistanceStart;
			attribute float instanceDistanceEnd;
			varying float vLineDistance;

		#endif

		void trimSegment( const in vec4 start, inout vec4 end ) {

			// trim end segment so it terminates between the camera plane and the near plane

			// conservative estimate of the near plane
			float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
			float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
			float nearEstimate = - 0.5 * b / a;

			float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

			end.xyz = mix( start.xyz, end.xyz, alpha );

		}

		void main() {

			#ifdef USE_COLOR

				vColor.xyz = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

			#endif

			float aspect = resolution.x / resolution.y;
			vec3 lineStart = instanceStart;
			vec3 lineEnd = instanceEnd;
			float nodeScale = 1.0;

			#ifdef InstancedLine

				int matrixIndex = gl_InstanceID % instanceMatrixCount;
				mat4 lineMatrix = readInstanceMatrix( matrixIndex );
				nodeScale = length( lineMatrix[ 0 ].xyz );
				lineStart = ( lineMatrix * vec4( lineStart, 1.0 ) ).xyz;
				lineEnd = ( lineMatrix * vec4( lineEnd, 1.0 ) ).xyz;

			#endif

			#ifdef USE_DASH

				vLineDistance = ( position.y < 0.5 )
					? dashScale * nodeScale * instanceDistanceStart
					: dashScale * nodeScale * instanceDistanceEnd;
				vUv = uv;

			#endif

			// camera space
			vec4 start = modelViewMatrix * vec4( lineStart, 1.0 );
			vec4 end = modelViewMatrix * vec4( lineEnd, 1.0 );

			#ifdef WORLD_UNITS

				worldStart = start.xyz;
				worldEnd = end.xyz;

			#else

				vUv = uv;

			#endif

			// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
			// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
			// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
			// perhaps there is a more elegant solution -- WestLangley

			bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

			if ( perspective ) {

				if ( start.z < 0.0 && end.z >= 0.0 ) {

					trimSegment( start, end );

				} else if ( end.z < 0.0 && start.z >= 0.0 ) {

					trimSegment( end, start );

				}

			}

			// clip space
			vec4 clipStart = projectionMatrix * start;
			vec4 clipEnd = projectionMatrix * end;

			// ndc space
			vec3 ndcStart = clipStart.xyz / clipStart.w;
			vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

			// direction
			vec2 dir = ndcEnd.xy - ndcStart.xy;

			// account for clip-space aspect ratio
			dir.x *= aspect;
			dir = normalize( dir );

			#ifdef WORLD_UNITS

				vec3 worldDir = normalize( end.xyz - start.xyz );
				vec3 tmpFwd = normalize( mix( start.xyz, end.xyz, 0.5 ) );
				vec3 worldUp = normalize( cross( worldDir, tmpFwd ) );
				vec3 worldFwd = cross( worldDir, worldUp );
				worldPos = position.y < 0.5 ? start: end;

				// height offset
				float hw = linewidth * 0.5;
				worldPos.xyz += position.x < 0.0 ? hw * worldUp : - hw * worldUp;

				// don't extend the line if we're rendering dashes because we
				// won't be rendering the endcaps
				#ifndef USE_DASH

					// cap extension
					worldPos.xyz += position.y < 0.5 ? - hw * worldDir : hw * worldDir;

					// add width to the box
					worldPos.xyz += worldFwd * hw;

					// endcaps
					if ( position.y > 1.0 || position.y < 0.0 ) {

						worldPos.xyz -= worldFwd * 2.0 * hw;

					}

				#endif

				// project the worldpos
				vec4 clip = projectionMatrix * worldPos;

				// shift the depth of the projected points so the line
				// segments overlap neatly
				vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
				clip.z = clipPose.z * clip.w;

			#else

				vec2 offset = vec2( dir.y, - dir.x );
				// undo aspect ratio adjustment
				dir.x /= aspect;
				offset.x /= aspect;

				// sign flip
				if ( position.x < 0.0 ) offset *= - 1.0;

				// endcaps
				if ( position.y < 0.0 ) {

					offset += - dir;

				} else if ( position.y > 1.0 ) {

					offset += dir;

				}

				// adjust for linewidth
				offset *= linewidth;

				// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
				offset /= resolution.y;

				// select end
				vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

				// back to clip space
				offset *= clip.w;

				clip.xy += offset;

			#endif

			gl_Position = clip;

			vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

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

		#ifdef InstancedLine

			out highp vec4 pc_fragColor;
			#define gl_FragColor pc_fragColor

		#endif

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

				if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

				if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

			#endif

			#ifdef WORLD_UNITS

				// Find the closest points on the view ray and the line segment
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

						if ( norm > 0.5 ) {

							discard;

						}

					#endif

				#endif

			#else

				#ifdef USE_ALPHA_TO_COVERAGE

					// artifacts appear on some hardware if a derivative is taken within a conditional
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

/**
 * A material for drawing wireframe-style geometries.
 *
 * Unlike {@link LineBasicMaterial}, it supports arbitrary line widths and allows using world units
 * instead of screen space units. This material is used with {@link LineSegments2} and {@link Line2}.
 *
 * This module can only be used with {@link WebGLRenderer}. When using {@link WebGPURenderer},
 * use {@link Line2NodeMaterial}.
 *
 * @augments ShaderMaterial
 * @three_import import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
 */
class InstancedLineMaterial extends ShaderMaterial {
    /**
     * Constructs a new line segments geometry.
     *
     * @param {Object} [parameters] - An object with one or more properties
     * defining the material's appearance. Any property of the material
     * (including any property from inherited materials) can be passed
     * in here. Color values can be passed any type of value accepted
     * by {@link Color#set}.
     */
    constructor(parameters: CustomLineMaterialParameters = {}) {
        super({
            glslVersion: GLSL3,
            uniforms: UniformsUtils.clone(ShaderLib["instanceLine"].uniforms),
            vertexShader: ShaderLib["instanceLine"].vertexShader,
            fragmentShader: ShaderLib["instanceLine"].fragmentShader,
            clipping: true, // required for clipping support
        })
        ;(this as any).isLineMaterial = true

        this.setValues(parameters)
    }

    get treeData(): DataTexture | null {
        return this.uniforms.treeData.value
    }

    set treeData(value: DataTexture | null) {
        this.uniforms.treeData.value = value
        this.instanced = value !== null
    }

    get treeDataSize(): number {
        return this.uniforms.treeDataSize.value
    }

    set treeDataSize(value: number) {
        this.uniforms.treeDataSize.value = Math.max(1, Math.floor(value))
    }

    get treeBlockOffset(): number {
        return this.uniforms.treeBlockOffset.value
    }

    set treeBlockOffset(value: number) {
        this.uniforms.treeBlockOffset.value = Math.max(0, Math.floor(value))
    }

    get treeBlockSize(): number {
        return this.uniforms.treeBlockSize.value
    }

    set treeBlockSize(value: number) {
        this.uniforms.treeBlockSize.value = Math.max(1, Math.floor(value))
    }

    get instanceMatrices(): DataTexture | null {
        return this.treeData
    }

    set instanceMatrices(value: DataTexture | null) {
        this.treeData = value
    }

    get instanceMatrixCount(): number {
        return this.uniforms.instanceMatrixCount.value
    }

    set instanceMatrixCount(value: number) {
        this.uniforms.instanceMatrixCount.value = Math.max(1, Math.floor(value))
    }

    get instanced(): boolean {
        return "InstancedLine" in this.defines
    }

    set instanced(value: boolean) {
        if ((value === true) !== this.instanced) {
            this.needsUpdate = true
        }

        if (value === true) {
            this.defines.InstancedLine = ""
            this.glslVersion = GLSL3
        } else {
            delete this.defines.InstancedLine
            this.glslVersion = null
        }
    }

    /**
     * The material's color.
     *
     * @type {Color}
     * @default (1,1,1)
     */
    get color(): Color {
        return this.uniforms.diffuse.value
    }

    set color(value: ColorRepresentation) {
        this.uniforms.diffuse.value = value
    }

    /**
     * Whether the material's sizes (width, dash gaps) are in world units.
     *
     * @type {boolean}
     * @default false
     */
    get worldUnits(): boolean {
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

    /**
     * Controls line thickness in CSS pixel units when `worldUnits` is `false` (default),
     * or in world units when `worldUnits` is `true`.
     *
     * @type {number}
     * @default 1
     */
    get linewidth(): number {
        return this.uniforms.linewidth.value
    }

    set linewidth(value: number) {
        if (!this.uniforms.linewidth) return
        this.uniforms.linewidth.value = value
    }

    /**
     * Whether the line is dashed, or solid.
     *
     * @type {boolean}
     * @default false
     */
    get dashed(): boolean {
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

    /**
     * The scale of the dashes and gaps.
     *
     * @type {number}
     * @default 1
     */
    get dashScale(): number {
        return this.uniforms.dashScale.value
    }

    set dashScale(value: number) {
        this.uniforms.dashScale.value = value
    }

    /**
     * The size of the dash.
     *
     * @type {number}
     * @default 1
     */
    get dashSize(): number {
        return this.uniforms.dashSize.value
    }

    set dashSize(value: number) {
        this.uniforms.dashSize.value = value
    }

    /**
     * Where in the dash cycle the dash starts.
     *
     * @type {number}
     * @default 0
     */
    get dashOffset(): number {
        return this.uniforms.dashOffset.value
    }

    set dashOffset(value: number) {
        this.uniforms.dashOffset.value = value
    }

    /**
     * The size of the gap.
     *
     * @type {number}
     * @default 0
     */
    get gapSize(): number {
        return this.uniforms.gapSize.value
    }

    set gapSize(value: number) {
        this.uniforms.gapSize.value = value
    }

    /**
     * The opacity.
     *
     * @type {number}
     * @default 1
     */
    get opacity(): number {
        return this.uniforms.opacity.value
    }

    set opacity(value: number) {
        if (!this.uniforms) return
        this.uniforms.opacity.value = value
    }

    /**
     * The size of the viewport, in screen pixels. This must be kept updated to make
     * screen-space rendering accurate.The `LineSegments2.onBeforeRender` callback
     * performs the update for visible objects.
     *
     * @type {Vector2}
     */
    get resolution(): Vector2 {
        return this.uniforms.resolution.value
    }

    set resolution(value: Vector2) {
        this.uniforms.resolution.value.copy(value)
    }

    /**
     * Whether to use alphaToCoverage or not. When enabled, this can improve the
     * anti-aliasing of line edges when using MSAA.
     *
     * @type {boolean}
     */
    get alphaToCoverage(): boolean {
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

export { InstancedLineMaterial }
