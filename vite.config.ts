import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

function manualChunks(id: string) {
    const normalizedId = id.replaceAll("\\", "/")

    if (
        normalizedId === "three" ||
        normalizedId.includes("/node_modules/three/") ||
        normalizedId.includes("three/examples/jsm/")
    ) {
        return "three"
    }

    if (normalizedId.includes("src/App/main.ts")) {
        return "app"
    }
}

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                manualChunks,
            },
        },
    },
})
