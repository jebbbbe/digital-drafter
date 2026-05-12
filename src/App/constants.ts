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
        },
        projection: {
            color: "#a7a7a7",
            visible: true,
        },
    },
    theme: "light",
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
                        visible: false,
                    },
                    projection: {
                        color: "#a7a7a7",
                        visible: true,
                    },
                },
            },
            light: {
                display: {
                    background: "#ffffff",
                    mesh: {
                        color: "#49cf6f",
                        visible: true,
                    },
                    line: {
                        color: "#000000",
                        visible: true,
                    },
                    dash: {
                        color: "#a7a7a7",
                        visible: true,
                    },
                    projection: {
                        color: "#dfdfdf",
                        visible: true,
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
                    },
                    projection: {
                        color: "#272727",
                        visible: true,
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
                    },
                    projection: {
                        color: "#A0A0A0",
                        visible: true,
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
                    },
                    projection: {
                        color: "#787878",
                        visible: true,
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
                    },
                    projection: {
                        color: "#6E6E6E",
                        visible: true,
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
                    },
                    projection: {
                        color: "#ffabab",
                        visible: true,
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
                    },
                    projection: {
                        color: "#819720",
                        visible: true,
                    },
                },
            },
            monaki: {
                display: {
                    background: "#272822", // background
                    mesh: {
                        color: "#272822", // background
                        visible: true,
                    },
                    line: {
                        color: "#F8F8F2", // text
                        visible: true,
                    },
                    dash: {
                        color: "#FD971F", // args
                        visible: true,
                    },
                    projection: {
                        color: "#75715E", // comment  // "#AE81FF ", // numbers
                        visible: true,
                    },
                },
                gizmo: {
                    xAxis: "#F92672", //new
                    yAxis: "#A6E22E", // function
                    zAxis: "#66D9EF", // const
                    active: "#E6DB74", // string
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
                    },
                    projection: {
                        color: "#5fdbeb",
                        visible: true,
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
