import { readFile, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import App from "../src/App"

const scriptDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(scriptDir, "..")
const distIndexPath = join(projectRoot, "dist", "index.html")

const template = await readFile(distIndexPath, "utf8")
const appMarkup = renderToStaticMarkup(createElement(App))

// Preserve Vite's built JS/CSS asset tags and only inject prerendered HTML into #root.
const renderedHtml = template.replace(
    '<div id="root"></div>',
    `<div id="root">${appMarkup}</div>`
)

if (renderedHtml === template) {
    throw new Error(
        "Static export failed: could not find root mount point in dist/index.html"
    )
}

// The browser still loads the generated JS bundle; this only pre-populates the HTML.
await writeFile(distIndexPath, renderedHtml, "utf8")
