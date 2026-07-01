export const InstanceCount = 32 as const

export const themeOptions = {
    Paper: "paper",
    Light: "light",
    Dark: "dark",
    Horn: "horn",
    Blade: "blade",
    Cab: "cab",
    Gum: "gum",
    Orchid: "orchid",
    Monaki: "monaki",
}
export type ThemeTitle = keyof typeof themeOptions
export type ThemeName = (typeof themeOptions)[keyof typeof themeOptions]

export { themes } from "./themes/themes"
