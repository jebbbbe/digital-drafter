import { defineConfig, type HmrContext, type PluginOption } from "vite"
import react from "@vitejs/plugin-react"

function fullReloadOnChange(): PluginOption {
    return {
        name: "full-reload-on-change",
        handleHotUpdate({ server }: HmrContext) {
            server.ws.send({ type: "full-reload" })
            return []
        },
    }
}

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), fullReloadOnChange()],
    build: {
        rolldownOptions: {
            output: {
                codeSplitting: {
                    includeDependenciesRecursively: false,
                    groups: [
                        {
                            name: "bvh",
                            priority: 3,
                            test: /node_modules[\\/](three-bvh-csg|three-mesh-bvh)[\\/]/,
                        },
                        {
                            name: "three",
                            priority: 2,
                            test: /node_modules[\\/]three[\\/]/,
                        },
                        {
                            name: "app",
                            priority: 1,
                            test: /[\\/]src[\\/]App[\\/]/,
                        },
                    ],
                },
            },
        },
    },
})
