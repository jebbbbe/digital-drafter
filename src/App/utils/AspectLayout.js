export class AspectLayout {
    constructor(aspect = undefined, domElement = undefined) {
        this.x = 1
        this.y = 1
        this.min = 1
        this.max = 1
        this.aspect = 1
        this.dynamic = false
        this.wx = 800
        this.wy = 800
        this.wa = 1
        this.borderPercent = 0
        this.cam = {
            l: -1,
            r: 1,
            t: 1,
            b: -1,
            n: 0,
            f: 1000,
        }
        this.useWindow = false // target is/isnt window
        if (domElement) {
            this.useWindow = false
            this.element = domElement
        } else {
            //default to window
            this.useWindow = true
            this.element = window
        }

        if (aspect) {
            this.updateAspect(aspect)
        }
        this.resizeHandler = undefined
    }
    getApsect() {
        if (this.useWindow) {
            return this.element.innerWidth / this.element.innerHeight
        }
        return this.element.clientWidth / this.element.clientHeight
    }
    getWidth() {
        if (this.useWindow) {
            return this.element.innerWidth
        }
        return this.element.clientWidth
    }
    getHeight() {
        if (this.useWindow) {
            return this.element.innerHeight
        }
        return this.element.clientHeight
    }
    updateAspect(a) {
        if (typeof a === "string") {
            this.aspect = this.getApsect()
            this.dynamic = true
            this.setCamAspect()
            this.resize()
        } else if (typeof a === "number") {
            this.aspect = a
            this.setCamAspect()
            this.resize()
        }
    }
    setCamAspect() {
        if (this.aspect <= 1.0) {
            this.cam.l = -1 * this.aspect
            this.cam.r = 1 * this.aspect
            this.cam.t = 1
            this.cam.b = -1
        } else {
            this.cam.l = -1
            this.cam.r = 1
            this.cam.t = 1 * (1 / this.aspect)
            this.cam.b = -1 * (1 / this.aspect)
        }
    }
    resize() {
        if (this.dynamic === true) {
            this.aspect = this.getApsect()
            this.setCamAspect()
            this.resizeConstantAspect()
        } else {
            this.resizeConstantAspect()
        }
    }
    resizeConstantAspect() {
        this.wx = this.getWidth()
        this.wy = this.getHeight()
        this.wa = this.wx / this.wy

        if (this.wa < this.aspect) {
            this.min = this.wx
            if (this.aspect <= 1.0) {
                //portrait
                this.x = this.min
                this.y = this.min * (1 / this.aspect)
            } else {
                // landscape
                this.x = this.min
                this.y = this.min * (1 / this.aspect)
            }
        } else if (this.wa === this.aspect) {
            this.min = Math.min(this.wx, this.wy)
            if (this.aspect <= 1.0) {
                //portrait
                this.x = this.min
                this.y = this.min * (1 / this.aspect)
            } else {
                // landscape
                this.x = this.min * this.aspect
                this.y = this.min
            }
        } else if (this.aspect < this.wa) {
            this.min = this.wy
            if (this.aspect <= 1.0) {
                //portrait
                this.x = this.min * this.aspect
                this.y = this.min
            } else {
                // landscape
                this.x = this.min * this.aspect
                this.y = this.min
            }
        }
        this.x = Math.round(this.x) //
        this.y = Math.round(this.y)
        this.max = Math.max(this.x, this.y)
    }

    resizeWindow(renderer, camera, callback) {
        // resizes window

        this.resize()

        renderer.setSize(this.x, this.y)
        if (this.dynamic && camera.type === "OrthographicCamera") {
            camera.left = this.cam.l
            camera.right = this.cam.r
            camera.top = this.cam.t
            camera.bottom = this.cam.b
            camera.updateProjectionMatrix()
        } else if (this.dynamic && camera.type === "PerspectiveCamera") {
            camera.aspect = this.aspect
            camera.updateProjectionMatrix()
        }
        if (!this.dynamic) {
            console.error("dynamic not implemented")
        }
        callback()
    }
    addResizeListener(renderer, camera, callback) {
        // adds resize listeners to page or container
        if (this.resizeHandler) {
            console.error("already a Listener.. call .removeResizeListener()")
            return
        }

        this.resizeWindow(renderer, camera, callback)

        if (this.useWindow) {
            this.resizeHandler = () => {
                this.resizeWindow(renderer, camera, callback)
            }
            window.addEventListener("resize", this.resizeHandler, false)
        } else {
            this.resizeHandler = new ResizeObserver(() => {
                this.resizeWindow(renderer, camera, callback)
            })
            this.resizeHandler.observe(this.element)
        }
    }
    removeResizeListener() {
        if (!this.resizeHandler) {
            return
        }

        if (this.useWindow) {
            window.removeEventListener("resize", this.resizeHandler, false)
        } else {
            this.resizeHandler.disconnect()
        }
        this.resizeHandler = undefined // Clean up the reference
    }
    getThreeOrthographicArgs() {
        return [
            this.cam.l,
            this.cam.r,
            this.cam.t,
            this.cam.b,
            this.cam.n,
            this.cam.f,
        ]
    }
    getThreePerspectiveArgs(fov) {
        return [fov, this.aspect, this.cam.n, this.cam.f]
    }
}
