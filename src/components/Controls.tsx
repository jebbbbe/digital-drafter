import { useMemo, useState } from "react"
import { controls } from "../App/index"
import { button, buttonGroup, folder, Leva, useControls } from "leva"
import { constants } from "../App/constants"

function Controls() {
    function getLevaTheme(themeKey: string) {
        const theme = constants.themes.objects[
            themeKey as keyof typeof constants.themes.objects
        ] as { leva?: Record<string, unknown> } | undefined

        return theme?.leva ?? {}
    }

    const [levaTheme, setLevaTheme] = useState(() =>
        getLevaTheme(constants.theme)
    )

    function wrapControls<T extends Record<string, any>>(obj: T): T {
        return Object.fromEntries(
            Object.entries(obj).map(([key, fn]) => {
                if (typeof fn !== "function") {
                    return [key, fn]
                }

                return [
                    key,
                    (...args: any[]) => {
                        const value = args[0]
                        const path = args[1]
                        const context = args[2]
                        if (context?.initial) return
                        if (context?.disabled) return
                        if (!context?.fromPanel) return
                        // console.log({ value, path, context })
                        return fn(value)
                    },
                ]
            })
        ) as T
    }
    const wControls = wrapControls(controls)

    const schema = useMemo(() => {
        const Export = folder(
            {
                saveCubeAsGlb: button(controls.saveCubeAsGlb),
                saveCubeAsGltf: button(controls.saveCubeAsGltf),
            },
            { collapsed: true }
        )

        const Debug = folder(
            {
                showStats: {
                    label: "Show Stats",
                    value: false,
                    onChange: wControls.setStatsVisible,
                },
                toggleCameraRotation: button(controls.toggleCameraRotation),
                Export,
            },
            { collapsed: false, color: "#d30000" }
        )

        const Actions = folder({
            "Add Test Node": button(() => controls.addTestNode()),
            "Add Many Test Nodes": button(() => {
                for (let i = 0; i < 20; i++) {
                    controls.addTestNode(100, 100)
                }
            }),
        })

        const Scene = folder(
            {
                Background: {
                    label: "Background",
                    value: constants.display.background,
                    onChange: wControls.setSceneColor,
                },
                Mesh: folder(
                    {
                        meshColor: {
                            label: "Color",
                            value: constants.display.mesh.color,
                            onChange: wControls.setMeshColor,
                        },
                        meshVisible: {
                            label: "Visible",
                            value: constants.display.mesh.visible,
                            onChange: wControls.setMeshVisible,
                        },
                    },
                    {}
                ),
                Line: folder({
                    lineColor: {
                        label: "Color",
                        value: constants.display.line.color,
                        onChange: wControls.setLineColor,
                    },
                    lineVisible: {
                        label: "Visible",
                        value: constants.display.line.visible,
                        onChange: wControls.setLineVisible,
                    },
                    lineLinewidth: {
                        label: "Line Width",
                        value: constants.display.line.lineWidth,
                        min: 0,
                        max: 10,
                        step: 0.001,
                        onChange: wControls.setLineWidth,
                    },
                }),
                Dash: folder({
                    dashColor: {
                        label: "Color",
                        value: constants.display.dash.color,
                        onChange: wControls.setDashColor,
                    },
                    dashVisible: {
                        label: "Visible",
                        value: constants.display.dash.visible,
                        onChange: wControls.setDashVisible,
                    },
                    dashSize: {
                        label: "Dash",
                        min: 0,
                        max: 0.25,
                        step: 0.001,
                        value: constants.display.dash.dashSize,
                        onChange: wControls.setDashDashSize,
                    },
                    gapSize: {
                        label: "Gap",
                        min: 0,
                        max: 0.25,
                        step: 0.001,
                        value: constants.display.dash.gapSize,
                        onChange: wControls.setDashGapSize,
                    },
                }),
                Projection: folder({
                    projectionColor: {
                        label: "Color",
                        value: constants.display.projection.color,
                        onChange: wControls.setProjectionColor,
                    },
                    projectionVisible: {
                        label: "Visible",
                        value: constants.display.projection.visible,
                        onChange: wControls.setProjectionVisible,
                    },
                }),
                Fold: folder({
                    foldColor: {
                        label: "Color",
                        value: constants.display.fold.color,
                        onChange: wControls.setFoldColor,
                    },
                    foldVisible: {
                        label: "Visible",
                        value: constants.display.fold.visible,
                        onChange: wControls.setFoldVisible,
                    },
                    foldDistance: {
                        label: "Distance",
                        min: 0,
                        max: 5,
                        step: 0.01,
                        value: constants.display.fold.foldDistance,
                        onChange: wControls.setFoldDistance,
                    },
                    foldSize: {
                        label: "Size",
                        min: 0,
                        max: 5,
                        step: 0.01,
                        value: constants.display.fold.foldSize,
                        onChange: wControls.setFoldSize,
                    },
                }),
            },
            { collapsed: true }
        )

        const Display = folder({
            theme: {
                label: "Theme",
                value: constants.theme,
                options: constants.themeOptions,
                onChange: (value, path, context) => {
                    const result = (
                        wControls.themeSelect as (...args: any[]) => unknown
                    )(value, path, context)

                    if (result) {
                        setLevaTheme(getLevaTheme(value))
                    }

                    return result
                },
            },
            Scene,
        })

        const Settings = folder(
            {
                controlScheme: {
                    label: "Control Scheme",
                    value: "default",
                    options: {
                        default: "default",
                    },
                    disabled: true,
                },
                snap: {
                    label: "Snap",
                    value: true,
                    disabled: true,
                },
            },
            { collapsed: true }
        )

        const Stub = folder({
            position: {
                value: {
                    x: 0,
                    z: 0,
                },
                min: -100,
                max: 100,
                step: 0.01,
                disabled: true,
                lock: true,
                onChange: wControls.moveNodeFromSelection,
            },
            rotate: {
                value: {
                    y: 0,
                    x: 0,
                },
                min: -180,
                max: 180,
                step: 0.5,
                disabled: true,
                onChange: wControls.rotateRootFromSelection,
            },
            scale: {
                value: 1,
                min: 0.05,
                max: 5,
                disabled: true,
                // onEditEnd: controls.scaleRootFromSelection,
                onChange: wControls.scaleRootFromSelection,
            },
            buttonGroup: buttonGroup({
                label: "",
                opts: {
                    Add: controls.addLeafNearbyRandomlyFromSelection,
                    Delete: controls.pruneNodeFromSelection,
                    Cut: controls.cutNodeFromSelection,
                },
            }),
        })

        return {
            Debug,
            Actions,
            Display,
            "Reset Camera": button(controls.resetCamera),
            "Download Image": button(() => controls.downloadImage()),
            Settings,
            Import: button(() => {}, { disabled: false }),
            Stub,
        }
    }, [])

    useControls(schema)

    return (
        <div id="panel">
            <Leva
                theme={levaTheme} // you can pass a custom theme (see the styling section)
                fill={true} // default = false, true makes the pane fill the parent dom node it's rendered in
                flat={true} // default = false, true removes border radius and shadow
                // oneLineLabels // default = false, alternative layout for labels, with labels and fields on separate rows
                collapsed={false} // default = false, when true the GUI is collapsed
                // hidden // default = false, when true the GUI is hidden
                // neverHide // default = false, when true the GUI stays visible even when no controls are mounted
                // hideCopyButton // default = false, hides the copy button in the title bar
                titleBar={{
                    // Configure title bar options
                    title: "Controls", // Custom title
                    drag: true, // Enable dragging
                    filter: false, // Enable filter/search
                    position: { x: 0, y: 0 }, // Initial position (when drag is enabled)
                    // onDrag: () => {}, // Callback when dragged
                }}
                // titleBar = {false}
            />
            {/* <button type="button" onClick={controls.randomizeCubeColor}>
                Randomize cube color
            </button>
            <button type="button" onClick={controls.toggleCube}>
                Toggle cube
            </button>
            <button type="button" onClick={controls.saveCubeAsGlb}>
                Save cube as .glb
            </button>
            <button type="button" onClick={controls.saveCubeAsGltf}>
                Save cube as .gltf
            </button> */}
        </div>
    )
}

export default Controls
