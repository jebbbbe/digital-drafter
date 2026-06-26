import { statsPanel } from "../AppContext"

export function setStatsVisible(value: boolean): void {
    statsPanel.setStatsEnabled(value)
}
