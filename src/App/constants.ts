import { themes } from "./themes/theme"

export const InstanceCount = 32 as const

/* 
leva: {
    colors: {
        elevation1: "#272822", // title BK
        elevation2: "#272822", // panel BK
        elevation3: "#F92672", // toggle, dropdown, number
        accent1: "#db1313", // btn cclick
        accent2: "#ff00d0", // btn color
        accent3: "#00ff0d", // btn border
        highlight1: "#000000", // title text
        highlight2: "#2200ff", // text
        highlight3: "#c8ff00", // folder + button text
        vivid1: "#00ff06", // ?
    },
},
*/

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

export const constants = {
    camera: {
        rotationEnabled: false,
        zoom: 0.175,
        position: [0, 100, 0],
    },
    display: {
        background: "#fcffee",
        mesh: {
            color: "#ffffff",
            visible: true,
        },
        line: {
            color: "#000000",
            visible: true,
            lineWidth: 1.5,
        },
        dash: {
            color: "#a7a7a7",
            visible: false,
            dashSize: 0.05,
            gapSize: 0.01,
        },
        projection: {
            color: "#a7a7a7",
            visible: true,
        },
        fold: {
            color: "#a7a7a7",
            visible: true,
            foldDistance: 0.875,
            foldSize: 1.75,
        },
        section: {
            color: "#000000",
        },
    },
    theme: "light",
    themes,
} as const
