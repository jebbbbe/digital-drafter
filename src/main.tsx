import { StrictMode } from "react"
import { createRoot, hydrateRoot } from "react-dom/client"
import "./index.css"
import App from "./App"
import Header from "./components/Header"
import Controls from "./components/Controls"

const rootElement = document.getElementById("root")

if (!rootElement) {
    throw new Error("Missing #root element")
}

const app = (
    <main>
        <Header />
        <div id="screen">
            <StrictMode>
                <Controls />
            </StrictMode>
            <App />
        </div>
    </main>
)
// createRoot(rootElement).render(app)

if (rootElement.hasChildNodes()) {
    hydrateRoot(rootElement, app)
} else {
    createRoot(rootElement).render(app)
}
