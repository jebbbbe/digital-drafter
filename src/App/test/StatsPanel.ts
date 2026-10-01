import * as THREE from "three"
import Stats from "three/examples/jsm/libs/stats.module.js"

export class StatsPanel {
    stats = new Stats()
    statsEnabled: boolean = false
    constructor(
        element: HTMLElement = document.body,
        enabled: boolean = false
    ) {
        element.appendChild(this.stats.dom)
        this.statsEnabled = enabled

        // show all 3
        // Array.from(this.stats.dom.children).forEach((panel) => {
        //     const el = panel as HTMLElement
        //     el.style.display = "block"
        // })

        // layout
        this.stats.dom.style.display = "flex"
        this.stats.dom.style.left = "auto"
        this.stats.dom.style.right = "0"
        this.stats.dom.style.top = "0"
        this.stats.dom.style.bottom = "auto"

		this.stats.showPanel(1)
    }
    dispose() {
        this.stats.dom.remove()
    }
    update() {
        if (this.statsEnabled) {
            this.stats?.update()
        }
    }
    syncStatsVisibility(): void {
        this.stats.dom.style.display = this.statsEnabled ? "" : "none"
    }
    setStatsEnabled(value: boolean): void {
        this.statsEnabled = value
        this.syncStatsVisibility()
    }
}
