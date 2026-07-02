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
            },
            line: {
                color: "#383b3b",
            },
            outline: {
                color: "#383b3b",
            },
            dash: {
                color: "#a7a7a7",
            },
            projection: {
                color: "#a7a7a7",
            },
            fold: {
                color: "#a7a7a7",
            },
            sectionLine: {
                color: "#383b3b",
            },
            sectionFace: {
                color: "#f9fff6",
            },
            sectionEdge: {
                color: "#383b3b",
            },
        },
    },
    light: {
        theme: "light",
        background: "#ffffff",
        materials: {
            mesh: {
                color: "#ffffff",
            },
            line: {
                color: "#000000",
            },
            outline: {
                color: "#000000",
            },
            dash: {
                color: "#000000",
            },
            projection: {
                color: "#000000",
            },
            fold: {
                color: "#000000",
            },
            sectionLine: {
                color: "#000000",
            },
            sectionFace: {
                color: "#ffffff",
            },
            sectionEdge: {
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
            },
            line: {
                color: "#ffffff",
            },
            outline: {
                color: "#ffffff",
            },
            dash: {
                color: "#bcbcbc",
            },
            projection: {
                color: "#ffffff",
                opacity: 0.35,
            },
            fold: {
                color: "#ffffff",
            },
            sectionLine: {
                color: "#ffffff",
            },
            sectionFace: {
                color: "#000000",
            },
            sectionEdge: {
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
            },
            line: {
                color: "#000000",
            },
            outline: {
                color: "#000000",
            },
            dash: {
                color: "#000000",
            },
            projection: {
                color: "#A0A0A0",
            },
            fold: {
                color: "#000000",
            },
            sectionLine: {
                color: "#ffffff",
            },
            sectionFace: {
                color: "#646464",
            },
            sectionEdge: {
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
            },
            line: {
                color: "#000000",
            },
            outline: {
                color: "#000000",
            },
            dash: {
                color: "#5E5E5E",
            },
            projection: {
                color: "#787878",
            },
            fold: {
                color: "#787878",
            },
            sectionLine: {
                color: "#ffffff",
            },
            sectionFace: {
                color: "#646464",
            },
            sectionEdge: {
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
            },
            line: {
                color: "#FFFFFF",
            },
            outline: {
                color: "#FFFFFF",
            },
            dash: {
                color: "#9A9A9A",
            },
            projection: {
                color: "#6E6E6E",
            },
            fold: {
                color: "#6E6E6E",
            },
            sectionLine: {
                color: "#FFFFFF",
            },
            sectionFace: {
                color: "#808080",
            },
            sectionEdge: {
                color: "#ffffff",
            },
        },
    },
    gum: {
        theme: "gum",
        background: "#ffdcd5",
        materials: {
            mesh: {
                color: "#ffd1d1",
            },
            line: {
                color: "#ed4e4e",
            },
            outline: {
                color: "#ed4e4e",
            },
            dash: {
                color: "#f49c9c",
            },
            projection: {
                color: "#ffabab",
            },
            fold: {
                color: "#ffabab",
            },
            sectionLine: {
                color: "#ed4e4e",
            },
            sectionFace: {
                color: "#f6b8b8",
            },
            sectionEdge: {
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
            },
            line: {
                color: "#f9519f",
            },
            outline: {
                color: "#f9519f",
            },
            dash: {
                color: "#f9519f",
            },
            projection: {
                color: "#819720",
            },
            fold: {
                color: "#819720",
            },
            sectionLine: {
                color: "#f9519f",
            },
            sectionFace: {
                color: "#fcfff0",
            },
            sectionEdge: {
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
            },
            line: {
                color: "#F8F8F2",
                opacity: 1.0,
            },
            outline: {
                color: "#F8F8F2",
            },
            dash: {
                color: "#FD971F",
                opacity: 1.0,
            },
            projection: {
                color: "#75715E",
                opacity: 1.0,
            },
            fold: {
                color: "#A6E22E",
            },
            sectionLine: {
                color: "#F92672",
            },
            sectionFace: {
                color: "#272822",
            },
            sectionEdge: {
                color: "#66D9EF",
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
