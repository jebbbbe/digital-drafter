import { levaStore } from "leva"

export const panelPaths = {
    scaleMatrix: "Debug.scaleMatrix",
    test: "Display.Background",
}

export function setLevaControlDisabled(
    path: string = panelPaths.test,
    disabled: boolean = true
) {
    console.log("setLevaControlDisabled", {
        path,
        disabled,
        visiblePaths: levaStore.getVisiblePaths(),
        dataPaths: Object.keys(levaStore.getData()),
    })
    levaStore.disableInputAtPath(path, disabled)
}
