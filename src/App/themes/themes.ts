type Theme = {
    theme: string
    background: string
    materials: Record<string, any>
    leva?: Record<string, any>
    gizmo?: Record<string, any>
}

export const themes: Record<string, Theme> = {
    paper: {
        theme: "paper",
        background: "#fffcee",
        materials: {
            mesh: {
                color: "#f9fff6",
                visible: true,
            },
            line: {
                color: "#383b3b",
                visible: true,
            },
            dash: {
                color: "#a7a7a7",
                visible: true,
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
            sectionLine: {
                color: "#000000",
            },
        },
    },
    light: {
        theme: "light",
        background: "#ffffff",
        materials: {
            mesh: {
                color: "#ffffff",
                visible: true,
            },
            line: {
                color: "#000000",
                visible: true,
            },
            dash: {
                color: "#000000",
                visible: true,
                dashSize: 0.05,
                gapSize: 0.01,
            },
            projection: {
                color: "#000000",
                visible: true,
            },
            fold: {
                color: "#000000",
                visible: true,
                foldDistance: 0.875,
                foldSize: 1.75,
            },
            sectionLine: {
                color: "#000000",
            },
        },
        leva: {
            colors: {
                elevation1: "#ececec",
                elevation2: "#f8f8f8",
                elevation3: "#d5d5d5",
                accent1: "#d1d1d1",
                accent2: "#a7a7a7",
                accent3: "#000000",
                highlight1: "#000000",
                highlight2: "#000000",
                highlight3: "#000000",
                vivid1: "#00ff06",
            },
        },
    },
    dark: {
        theme: "dark",
        background: "#000000",
        materials: {
            mesh: {
                color: "#000000",
                visible: true,
            },
            line: {
                color: "#ffffff",
                visible: true,
            },
            dash: {
                color: "#bcbcbc",
                visible: true,
                dashSize: 0.05,
                gapSize: 0.01,
            },
            projection: {
                color: "#272727",
                visible: true,
            },
            fold: {
                color: "#272727",
                visible: true,
                foldDistance: 0.875,
                foldSize: 1.75,
            },
            sectionLine: {
                color: "#ffffff",
            },
        },
        leva: {
            colors: {
                elevation1: "#1d1d1d",
                elevation2: "#000000",
                elevation3: "#4b4b4b",
                accent1: "#a3a3a3",
                accent2: "#9a9a9a",
                accent3: "#ffffff",
                highlight1: "#ffffff",
                highlight2: "#ffffff",
                highlight3: "#ffffff",
                vivid1: "#00ff06",
            },
        },
    },
    horn: {
        theme: "horn",
        background: "#B4B4B4",
        materials: {
            mesh: {
                color: "#646464",
                visible: true,
            },
            line: {
                color: "#000000",
                visible: true,
            },
            dash: {
                color: "#000000",
                visible: true,
                dashSize: 0.05,
                gapSize: 0.01,
            },
            projection: {
                color: "#A0A0A0",
                visible: true,
            },
            fold: {
                color: "#000000",
                visible: true,
                foldDistance: 0.875,
                foldSize: 1.75,
            },
            sectionLine: {
                color: "#ffffff",
            },
        },
    },
    blade: {
        theme: "blade",
        background: "#363636",
        materials: {
            mesh: {
                color: "#646464",
                visible: true,
            },
            line: {
                color: "#000000",
                visible: true,
            },
            dash: {
                color: "#5E5E5E",
                visible: true,
                dashSize: 0.05,
                gapSize: 0.01,
            },
            projection: {
                color: "#787878",
                visible: true,
            },
            fold: {
                color: "#787878",
                visible: true,
                foldDistance: 0.875,
                foldSize: 1.75,
            },
            sectionLine: {
                color: "#ffffff",
            },
        },
    },
    cab: {
        theme: "cab",
        background: "#2B2B2B",
        materials: {
            mesh: {
                color: "#808080",
                visible: true,
            },
            line: {
                color: "#FFFFFF",
                visible: true,
            },
            dash: {
                color: "#9A9A9A",
                visible: true,
                dashSize: 0.05,
                gapSize: 0.01,
            },
            projection: {
                color: "#6E6E6E",
                visible: true,
            },
            fold: {
                color: "#6E6E6E",
                visible: true,
                foldDistance: 0.875,
                foldSize: 1.75,
            },
            sectionLine: {
                color: "#FFFFFF",
            },
        },
    },
    gum: {
        theme: "gum",
        background: "#ffdcd5",
        materials: {
            mesh: {
                color: "#ffd1d1",
                visible: true,
            },
            line: {
                color: "#ed4e4e",
                visible: true,
            },
            dash: {
                color: "#f49c9c",
                visible: true,
                dashSize: 0.05,
                gapSize: 0.01,
            },
            projection: {
                color: "#ffabab",
                visible: true,
            },
            fold: {
                color: "#ffabab",
                visible: true,
                foldDistance: 0.875,
                foldSize: 1.75,
            },
            sectionLine: {
                color: "#ed4e4e",
            },
        },
    },
    orchid: {
        theme: "orchid",
        background: "#d0d5b7",
        materials: {
            mesh: {
                color: "#fcfff0",
                visible: true,
            },
            line: {
                color: "#f9519f",
                visible: true,
            },
            dash: {
                color: "#f9519f",
                visible: true,
                dashSize: 0.05,
                gapSize: 0.01,
            },
            projection: {
                color: "#819720",
                visible: true,
            },
            fold: {
                color: "#819720",
                visible: true,
                foldDistance: 0.875,
                foldSize: 1.75,
            },
            sectionLine: {
                color: "#f9519f",
            },
        },
    },
    monaki: {
        theme: "monaki",
        /*
                black background 272822
                white text F8F8F2
                orange args FD971F
                green function A6E22E
                magenta f92672
                purple AE81FF
                red F92672
                blue 66D9EF
                yellow E6DB74
                grey comment 75715E
                */
        background: "#272822",
        materials: {
            mesh: {
                color: "#272822",
                visible: true,
            },
            line: {
                color: "#F8F8F2",
                visible: true,
            },
            dash: {
                color: "#FD971F",
                visible: true,
                dashSize: 0.05,
                gapSize: 0.01,
            },
            projection: {
                color: "#75715E",
                visible: true,
            },
            fold: {
                color: "#A6E22E",
                visible: true,
                foldDistance: 0.875,
                foldSize: 1.75,
            },
            sectionLine: {
                color: "#F92672",
            },
        },
        gizmo: {
            xAxis: "#F92672",
            yAxis: "#A6E22E",
            zAxis: "#66D9EF",
            active: "#E6DB74",
        },
        leva: {
            colors: {
                elevation1: "#75715E", // title BK
                elevation2: "#272822", // panel BK
                elevation3: "#75715E", // toggle, dropdown, number
                accent1: "#AE81FF", // btn click
                accent2: "#75715E", // btn color
                accent3: "#f92672", // btn border
                highlight1: "#F8F8F2", // title text
                highlight2: "#F8F8F2", // text  F8F8F2
                highlight3: "#E6DB74", // folder + button text
                vivid1: "#00ff06", // ?
            },
        },
    },
}
