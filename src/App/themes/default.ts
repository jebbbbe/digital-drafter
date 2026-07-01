type material = {
    color: string
    opacity: number
}

type LineMaterial = material & {
    linewidth: number
    dashed: boolean
    dashSize: number
    gapSize: number
}

type foldMaterial = LineMaterial & {
    foldSize: number
    foldDistance: number
}

export type SettingsMaterials = {
    mesh: material
    line: LineMaterial
    dash: LineMaterial
    projection: LineMaterial
    fold: foldMaterial
    sectionLine: LineMaterial
    outline: LineMaterial
    sectionFace: material
    sectionEdge: LineMaterial
}
export type SettingsObjects = {
    mesh: Record<string, any>
    line: Record<string, any>
    dash: Record<string, any>
    projection: Record<string, any>
    fold: Record<string, any>
    sectionLine: Record<string, any>
    outline: Record<string, any>
    sectionFace: Record<string, any>
    sectionEdge: Record<string, any>
}

export type SettingsDisplay = {
    theme: string
    background: string
    materials: SettingsMaterials
    objects: SettingsObjects
    leva: Record<string, any>
    gizmo: Record<string, any>
}

const notDashed = {
    dashed: false,
    dashSize: 0.05,
    gapSize: 0.01,
}
const useDashed = {
    dashed: true,
    dashSize: 0.05,
    gapSize: 0.01,
}
const defaultObject = {
    visible: true,
}

export const defaultTheme: SettingsDisplay = {
    theme: "default",
    background: "#ffffff",
    materials: {
        mesh: {
            color: "#ffffff",
            opacity: 1.0,
        },
        line: {
            color: "#000000",
            opacity: 1.0,
            linewidth: 1.25,
            ...notDashed,
        },
        outline: {
            color: "#000000",
            opacity: 1.0,
            linewidth: 3,
            ...notDashed,
        },
        dash: {
            color: "#000000",
            opacity: 0.5,
            linewidth: 0.75,
            ...useDashed,
        },
        projection: {
            color: "#000000",
            opacity: 0.1,
            linewidth: 1,
            ...notDashed,
        },
        fold: {
            color: "#000000",
            opacity: 0.4,
            linewidth: 1,
            ...notDashed,
            foldDistance: 0.875,
            foldSize: 1.75,
        },

        sectionFace: {
            color: "#000000",
            opacity: 1.0,
        },
        sectionEdge: {
            color: "#000000",
            opacity: 1.0,
            linewidth: 3.25,
            ...notDashed,
        },
        sectionLine: {
            color: "#000000",
            opacity: 1.0,
            linewidth: 1.15,
            ...notDashed,
        },
    },
    objects: {
        mesh: {
            ...defaultObject,
        },
        line: {
            ...defaultObject,
        },
        outline: {
            ...defaultObject,
        },
        dash: {
            ...defaultObject,
        },
        projection: {
            ...defaultObject,
        },
        fold: {
            ...defaultObject,
        },

        sectionFace: {
            ...defaultObject,
        },
        sectionEdge: {
            ...defaultObject,
        },
        sectionLine: {
            ...defaultObject,
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
    gizmo: {},
}

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
