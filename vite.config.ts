import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
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
