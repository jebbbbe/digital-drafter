import {
    GLSL3,
    ShaderLib,
    ShaderMaterial,
    UniformsLib,
    UniformsUtils,
    Vector2,
} from "three"

import instancedLineMaterialFrag from "./glsl/InstancedLineMaterialFrag.glsl?raw"
import instancedLineMaterialVert from "./glsl/InstancedLineMaterialVert.glsl?raw"

import { InstanceCount } from "../../constants"

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
    treeBlockSize: { value: InstanceCount },
    instanceMatrixCount: { value: 1 },
}

ShaderLib["instanceLine"] = {
    uniforms: UniformsUtils.merge([
        UniformsLib.common,
        UniformsLib.fog,
        (UniformsLib as any).instanceLine,
    ]),

    vertexShader: instancedLineMaterialVert,
    fragmentShader: instancedLineMaterialFrag,
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
