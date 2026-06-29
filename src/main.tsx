import { createRoot, hydrateRoot } from "react-dom/client"
import "./index.css"
import App from "./App"
import Header from "./components/Header"

const rootElement = document.getElementById("root")

if (!rootElement) {
    throw new Error("Missing #root element")
}

const app = (
    <main>
        <Header />
        <App />
    </main>
)
// createRoot(rootElement).render(app)

if (rootElement.hasChildNodes()) {
    hydrateRoot(rootElement, app)
} else {
    createRoot(rootElement).render(app)
}
