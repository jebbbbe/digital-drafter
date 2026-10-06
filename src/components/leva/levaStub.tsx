import { themeOptions } from "../../App/constants"
import * as controls from "../../App/controls"
import { geometryTitles } from "../../App/objects/geometries/library"
import { settings } from "../../App/settings"

const noop = () => undefined

export const levaStub: any = {
	// seems liek thsi should be inline..
    controls: Object.fromEntries(
        Object.keys(controls).map((name) => [name, noop])
    ),
    settings,
    themeOptions,
    geometryTitles,
    panelTool: {
        onMoveStart: noop,
        onMove: noop,
    },
}

export const appStub = { bridge: levaStub }
export type AppStubType = typeof appStub
