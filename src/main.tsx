import { StrictMode } from "react"
import { createRoot, hydrateRoot } from "react-dom/client"
import "./index.css"
import "./App.css"
import App from "./App"

const rootElement = document.getElementById("root")

if (!rootElement) {
    throw new Error("Missing #root element")
}

const app = (
    <StrictMode>
        <App />
    </StrictMode>
)

if (rootElement.hasChildNodes()) {
    hydrateRoot(rootElement, app)
} else {
    createRoot(rootElement).render(app)
}
