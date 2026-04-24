import { useEffect, useRef } from "react"
import { init } from "./App/Main"

function App() {
    const cubeMountRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!cubeMountRef.current) {
            return
        }

        let disposeScene = init(cubeMountRef.current)
        let isMounted = true

        if (import.meta.hot) {
            import.meta.hot.accept("./App/Main", (updatedModule) => {
                if (!updatedModule || !isMounted || !cubeMountRef.current) {
                    return
                }

                disposeScene()
                disposeScene = updatedModule.mountRotatingCube(
                    cubeMountRef.current
                )
            })
        }

        return () => {
            isMounted = false
            disposeScene()
        }
    }, [])

    return (
        <main>
            <h1>Three.js r183 Cube</h1>
            <p>
                WebGL renderer imported from the default three package export.
            </p>
            <div id="app" ref={cubeMountRef} aria-label="Rotating 3D cube" />
        </main>
    )
}

export default App
