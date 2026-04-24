import { useEffect, useRef } from "react"
import { init } from "./App/main"
import { randomizeCubeColor } from "./App/controls"

function App() {
    const cubeMountRef = useRef<HTMLDivElement | null>(null)

    const handleChangeCubeColor = () => {
        randomizeCubeColor()
    }

    useEffect(() => {
        if (!cubeMountRef.current) {
            return
        }

        let disposeScene = init(cubeMountRef.current)
        let isMounted = true

        if (import.meta.hot) {
            import.meta.hot.accept("./App/main", (updatedModule) => {
                if (!updatedModule || !isMounted || !cubeMountRef.current) {
                    return
                }

                disposeScene()
                disposeScene = updatedModule.init(cubeMountRef.current)
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
            <button type="button" onClick={handleChangeCubeColor}>
                Randomize cube color
            </button>
            <div id="app" ref={cubeMountRef} aria-label="Rotating 3D cube" />
        </main>
    )
}

export default App
