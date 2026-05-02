import * as THREE from "three"

export function getMaxRenderTargetSize(renderer: THREE.WebGLRenderer): number {
    const gl = renderer.getContext()
    const maxTextureSize = renderer.capabilities.maxTextureSize
    const maxRenderbufferSize = gl.getParameter(
        gl.MAX_RENDERBUFFER_SIZE
    ) as number
    return Math.min(maxTextureSize, maxRenderbufferSize)
}
