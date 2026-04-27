import { useEffect, useRef } from "react"
import { init } from "./App/main"

function App() {
    const threeSceneMountRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!threeSceneMountRef.current) {
            return
        }

        let disposeScene = init(threeSceneMountRef.current)
        let isMounted = true

        if (import.meta.hot) {
            import.meta.hot.accept("./App/main", (updatedModule) => {
                if (
                    !updatedModule ||
                    !isMounted ||
                    !threeSceneMountRef.current
                ) {
                    return
                }

                disposeScene()
                disposeScene = updatedModule.init(threeSceneMountRef.current)
            })
        }

        return () => {
            isMounted = false
            disposeScene()
        }
    }, [])

    return <div id="app" ref={threeSceneMountRef} />
}

export default App
