import { themes } from "./constants"
import { defaultTheme } from "./themes/default"
import type { SettingsDisplay } from "./themes/default"

export type Settings = {
    camera: {
        rotationEnabled: boolean
        zoom: number
        position: [number, number, number]
    }
    display: SettingsDisplay
}

const settings = {
    camera: {
        rotationEnabled: false,
        zoom: 0.175,
        position: [0, 100, 0],
    },
    display: {
        theme: "light",
        background: defaultTheme.background,
        materials: structuredClone(defaultTheme.materials),
        objects: structuredClone(defaultTheme.objects),
        leva: {},
        gizmo: {},
    },
} as Settings

function isObject(value: unknown): value is Record<string, any> {
    return !!value && typeof value === "object" && !Array.isArray(value)
}

function clearObject(target: Record<string, any>): void {
    for (const key of Object.keys(target)) {
        delete target[key]
    }
}

function copyObjectProps(
    target: Record<string, any>,
    source: Record<string, any>,
    createMissing = false
): void {
    for (const [key, value] of Object.entries(source)) {
        if (!(key in target) && !createMissing) {
            continue
        }

        if (isObject(value)) {
            const nextTarget = target[key]
            if (isObject(nextTarget)) {
                copyObjectProps(nextTarget, value, createMissing)
                continue
            }

            if (createMissing) {
                target[key] = {}
                copyObjectProps(target[key], value, createMissing)
            }
            continue
        }

        Object.assign(target, { [key]: value })
    }
}

export function setTheme(
    themeTitle: string = settings.display.theme,
    _settings: Settings = settings
) {
    const theme = themes[themeTitle]
    if (!theme) return false

    _settings.display.theme = themeTitle
    copyObjectProps(_settings.display.materials, defaultTheme.materials)
    copyObjectProps(_settings.display.materials, theme.materials)

    copyObjectProps(_settings.display.objects, defaultTheme.objects)

    // clearObject(_settings.display.leva)
    _settings.display.leva = {}
    if (theme.leva) {
        copyObjectProps(_settings.display.leva, theme.leva, true)
    }

    // clearObject(_settings.display.gizmo)
    _settings.display.gizmo = {}
    if (theme.gizmo) {
        copyObjectProps(_settings.display.gizmo, theme.gizmo, true)
    }
    return true
}

setTheme(settings.display.theme)
export { settings }
