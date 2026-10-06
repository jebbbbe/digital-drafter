import { StrictMode } from "react"
import { useEffect, useRef, useState } from "react"
import Controls from "./components/Controls"
import { linkThreeApp } from "./AppEventManager"
import { appStub, levaStub } from "./components/leva/levaStub"

function App() {
    const threeSceneMountRef = useRef<HTMLDivElement | null>(null)
    const [app, setApp] = useState<any>(appStub)

    useEffect(() => {
        let cancelled = false
        let app: any

        ;(async () => {
            if (!threeSceneMountRef.current) {
                return
            }

            app = await linkThreeApp(threeSceneMountRef.current, {})
            if (cancelled) return app.dispose()

            setApp(app)
        })()

        return () => {
            cancelled = true
            app?.dispose()
            setApp(null)
        }
    }, [])

    return (
        <div id="screen">
            <StrictMode>
                <Controls bridge={app?.bridge ?? levaStub} />
            </StrictMode>
            <div id="app" ref={threeSceneMountRef} />
        </div>
    )
}

export default App
