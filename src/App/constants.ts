export const InstanceCount = 32 as const
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
            foldDistance: 1.75,
            foldSize: 1.75,
        },
    },
    theme: "paper",
    themeOptions: {
        Paper: "paper",
        Light: "light",
        Dark: "dark",
        Horn: "horn",
        Blade: "blade",
        Cab: "cab",
        Gum: "gum",
        Orchid: "orchid",
        Monaki: "monaki",
        Neon: "neon",
    },
    themes: {
        objects: {
            paper: {
                display: {
                    background: "#fffcee",
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
                        foldDistance: 1.75,
                        foldSize: 1.75,
                    },
                },
            },
            light: {
                display: {
                    background: "#ffffff",
                    mesh: {
                        color: "#ffffff",
                        visible: true,
                    },
                    line: {
                        color: "#000000",
                        visible: true,
                    },
                    dash: {
                        color: "#a7a7a7",
                        visible: true,
                        dashSize: 0.05,
                        gapSize: 0.01,
                    },
                    projection: {
                        color: "#dfdfdf",
                        visible: true,
                    },
                    fold: {
                        color: "#a7a7a7",
                        visible: true,
                        foldDistance: 1.75,
                        foldSize: 1.75,
                    },
                },
                leva: {
                    colors: {
                        elevation1: "#ffffff",
                        elevation2: "#ffffff",
                        elevation3: "#d5d5d5",
                        accent1: "#d1d1d1",
                        accent2: "#767676",
                        accent3: "#000000",
                        highlight1: "#000000",
                        highlight2: "#000000",
                        highlight3: "#000000",
                        vivid1: "#00ff06",
                    },
                },
            },
            dark: {
                display: {
                    background: "#000000",
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
                        foldDistance: 1.75,
                        foldSize: 1.75,
                    },
                },
                leva: {
                    colors: {
                        elevation1: "#000000",
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
                display: {
                    background: "#B4B4B4",
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
                        foldDistance: 1.75,
                        foldSize: 1.75,
                    },
                },
            },
            blade: {
                display: {
                    background: "#363636",
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
                        foldDistance: 1.75,
                        foldSize: 1.75,
                    },
                },
            },
            cab: {
                display: {
                    background: "#2B2B2B",
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
                        foldDistance: 1.75,
                        foldSize: 1.75,
                    },
                },
            },
            gum: {
                display: {
                    background: "#ffdcd5",
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
                        foldDistance: 1.75,
                        foldSize: 1.75,
                    },
                },
            },
            orchid: {
                display: {
                    background: "#d0d5b7",
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
                        foldDistance: 1.75,
                        foldSize: 1.75,
                    },
                },
            },
            monaki: {
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
                display: {
                    background: "#272822",
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
                        foldDistance: 1.75,
                        foldSize: 1.75,
                    },
                },
                gizmo: {
                    xAxis: "#F92672",
                    yAxis: "#A6E22E",
                    zAxis: "#66D9EF",
                    active: "#E6DB74",
                },
            },
            neon: {
                display: {
                    background: "#0073ff",
                    mesh: {
                        color: "#528bdb",
                        visible: true,
                    },
                    line: {
                        color: "#ffff00",
                        visible: true,
                    },
                    dash: {
                        color: "#ff00b7",
                        visible: true,
                        dashSize: 0.05,
                        gapSize: 0.01,
                    },
                    projection: {
                        color: "#5fdbeb",
                        visible: true,
                    },
                    fold: {
                        color: "#5fdbeb",
                        visible: true,
                        foldDistance: 1.75,
                        foldSize: 1.75,
                    },
                },
            },
        },
        // not implemented
        // leva css settings
        workspace: {
            default: {
                title: "Default",
                leva: {}, // leva settings
                style: {}, // other/gizmo/screen
            },
        },
    },
} as const
