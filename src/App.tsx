import { useEffect, useRef } from "react"

function App() {
    const cubeMountRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        let disposeScene: (() => void) | undefined
        let isMounted = true

        const mountScene = async () => {
            // Dynamic import keeps Three.js out of the initial bundle,
            // so first paint is faster and 3D code loads after mount.
            const { mountRotatingCube } = await import("./App/Main")

            if (!isMounted || !cubeMountRef.current) {
                return
            }

            disposeScene = mountRotatingCube(cubeMountRef.current)
        }

        void mountScene()

        return () => {
            isMounted = false
            disposeScene?.()
        }
    }, [])

    return (
        <main className="app">
            <h1>Three.js r183 Cube</h1>
            <p>
                WebGL renderer imported from the default three package export.
            </p>
            <div
                id="app"
                className="cube-mount"
                ref={cubeMountRef}
                aria-label="Rotating 3D cube"
            />
        </main>
    )
}

export default App
