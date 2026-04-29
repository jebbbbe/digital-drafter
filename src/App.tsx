import { useEffect, useRef } from "react"

function App() {
    const threeSceneMountRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!threeSceneMountRef.current) {
            return
        }

        let isMounted = true
        let disposeScene = () => {}

        void import("./App/index").then((module) => {
            if (!isMounted || !threeSceneMountRef.current) {
                return
            }

            disposeScene = module.init(threeSceneMountRef.current)

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
        })

        return () => {
            isMounted = false
            disposeScene()
        }
    }, [])

    return <div id="app" ref={threeSceneMountRef} />
}

export default App
