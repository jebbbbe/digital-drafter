import { statsPanel } from "../main"

export function setStatsVisible(value: boolean): void {
    statsPanel.setStatsEnabled(value)
}
