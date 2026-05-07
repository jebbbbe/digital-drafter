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
    theme: "default",
    themeOptions: {
        Default: "default",
        Light: "light",
        Dark: "dark",
        Neon: "neon",
    },
    themes: {
        objects: {
            default: {
                display: {
                    background: "#fcffee",
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
                    },
                    projection: {
                        color: "#a7a7a7",
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
                        color: "#4d4d4d",
                        visible: true,
                    },
                    projection: {
                        color: "#4d4d4d",
                        visible: true,
                    },
                },
            },
            neon: {
                display: {
                    background: "#5194e7",
                    mesh: {
                        color: "#528bdb",
                        visible: true,
                    },
                    line: {
                        color: "#ffff00",
                        visible: true,
                    },
                    dash: {
                        color: "#ed5cc4",
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
