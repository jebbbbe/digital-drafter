import { StrictMode } from "react"
import { useEffect, useRef, useState } from "react"
import Controls from "./components/Controls"
import { linkThreeApp } from "./AppEventManager/index"

function App() {
    const threeSceneMountRef = useRef<HTMLDivElement | null>(null)
    const [app, setApp] = useState<any | null>(null)

    useEffect(() => {
        let cancelled = false

        ;(async () => {
            if (!threeSceneMountRef.current) {
                return
            }

            const app = await linkThreeApp(threeSceneMountRef.current)
            if (cancelled) return app.dispose()

            setApp(app)
        })()

        return () => {
            cancelled = true
            app.dispose()
            setApp(null)
        }
    }, [])

    return (
        <div id="screen">
            <StrictMode>
				{app && <Controls bridge={app.bridge} />}
			</StrictMode>
            <div id="app" ref={threeSceneMountRef} />
        </div>
    )
}

export default App
