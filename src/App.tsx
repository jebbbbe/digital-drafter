import { useEffect, useRef } from "react"
import { init } from "./App/index"

function App() {
    const threeSceneMountRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!threeSceneMountRef.current) {
            return
        }

        let disposeScene = init(threeSceneMountRef.current)
        let isMounted = true

        if (import.meta.hot) {
            import.meta.hot.accept("./App/index", (updatedModule) => {
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
