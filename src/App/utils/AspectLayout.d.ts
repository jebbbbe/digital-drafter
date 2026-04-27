export class AspectLayout {
    constructor(aspect?: string | number, domElement?: HTMLElement)

    x: number
    y: number
    min: number
    max: number
    aspect: number
    dynamic: boolean
    wx: number
    wy: number
    wa: number
    borderPercent: number
    cam: {
        l: number
        r: number
        t: number
        b: number
        n: number
        f: number
    }

    getApsect(): number
    getWidth(): number
    getHeight(): number
    updateAspect(a: string | number): void
    setCamAspect(): void
    resize(): void
    resizeConstantAspect(): void
    resizeWindow(
        renderer: import("three").WebGLRenderer,
        camera: import("three").OrthographicCamera | import("three").PerspectiveCamera,
        callback: () => void
    ): void
    addResizeListener(
        renderer: import("three").WebGLRenderer,
        camera: import("three").OrthographicCamera | import("three").PerspectiveCamera,
        callback: () => void
    ): void
    removeResizeListener(): void
    getThreeOrthographicArgs(): [number, number, number, number, number, number]
    getThreePerspectiveArgs(fov: number): [number, number, number, number]
}
