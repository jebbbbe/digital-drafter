import { useEffect, useRef } from "react"
import { init } from "./App/index"

function App() {
    const threeSceneMountRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!threeSceneMountRef.current) {
            return
        }

        let isMounted = true
        let currentInit = init
        let disposeScene = currentInit(threeSceneMountRef.current)

        if (import.meta.hot) {
            import.meta.hot.accept("./App/index", (updatedModule) => {
                if (!updatedModule || !isMounted || !threeSceneMountRef.current) {
                    return
                }

                currentInit = updatedModule.init
                disposeScene()
                disposeScene = currentInit(threeSceneMountRef.current)
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
