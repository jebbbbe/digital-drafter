import { useEffect, useMemo, useState } from "react"
import { button, buttonGroup, folder, Leva, useControls } from "leva"

const isDev = import.meta.env.DEV

function Controls({ bridge }: any) {
    const { controls, settings, themeOptions, geometryTitles, panelTool } =
        bridge

    const [levaTheme, setLevaTheme] = useState(
        () => settings.display.leva ?? {}
    )

    useEffect(() => {
        setLevaTheme(settings.display.leva ?? {})
    }, [settings.display.leva])

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
                        // console.log(fn)
                        return fn(value)
                    },
                ]
            })
        ) as T
    }
    const wControls = wrapControls(controls)
    const panelUpdates = {
        onMoveStart: (...args: any[]) => {
            panelTool.onMoveStart(args[0])
        },
        onMove: (...args: any[]) => {
            panelTool.onMove(args[0])
        },
    }
    const wPanelTool = wrapControls(panelUpdates)

    const schema = useMemo(() => {
        const Export = folder(
            {
                saveCubeAsGlb: button(controls.saveCubeAsGlb),
                saveCubeAsGltf: button(controls.saveCubeAsGltf),
            },
            { collapsed: true }
        )

        const Actions = folder({
            "Add Test Node": button(() => controls.addTestNode()),
            "Add Many Test Nodes": button(() => {
                for (let i = 0; i < 20; i++) {
                    controls.addTestNode(100, 100)
                }
            }),
        })

        const Debug = isDev
            ? folder(
                  {
                      showStats: {
                          label: "Show Stats",
                          value: true,
                          onChange: wControls.setStatsVisible,
                      },
                      "Reset Camera": button(controls.resetCamera),
                      "Toggle Camera Rotation": button(
                          controls.toggleCameraRotation
                      ),
                      // Export,
                      Actions,
                  },
                  { collapsed: false, color: "#d30000" }
              )
            : undefined

        const Display = folder(
            {
                Background: {
                    label: "Background",
                    value: settings.display.background,
                    onChange: wControls.setSceneColor,
                },
                Mesh: folder(
                    {
                        meshColor: {
                            label: "Color",
                            value: settings.display.materials.mesh.color,
                            onChange: wControls.setMeshColor,
                        },
                        // meshOpacity: {
                        //     label: "Opacity",
                        //     value: settings.display.materials.mesh.opacity,
                        //     min: 0,
                        //     max: 1,
                        //     step: 0.001,
                        //     onChange: wControls.setMeshOpacity,
                        // },
                        // meshVisible: {
                        //     label: "Visible",
                        //     value: settings.display.objects.mesh.visible,
                        //     onChange: wControls.setMeshVisible,
                        // },
                    },
                    { collapsed: true }
                ),
                Line: folder(
                    {
                        lineColor: {
                            label: "Color",
                            value: settings.display.materials.line.color,
                            onChange: wControls.setLineColor,
                        },
                        // lineOpacity: {
                        //     label: "Opacity",
                        //     value: settings.display.materials.line.opacity,
                        //     min: 0,
                        //     max: 1,
                        //     step: 0.001,
                        //     onChange: wControls.setLineOpacity,
                        // },
                        lineWidth: {
                            label: "Line Width",
                            value: settings.display.materials.line.linewidth,
                            min: 0,
                            max: 10,
                            step: 0.001,
                            onChange: wControls.setLineWidth,
                        },
                    },
                    { collapsed: true }
                ),
                Outline: folder(
                    {
                        outlineColor: {
                            label: "Color",
                            value: settings.display.materials.outline.color,
                            onChange: wControls.setOutlineColor,
                        },
                        // outlineOpacity: {
                        //     label: "Opacity",
                        //     value: settings.display.materials.outline.opacity,
                        //     min: 0,
                        //     max: 1,
                        //     step: 0.001,
                        //     onChange: wControls.setOutlineOpacity,
                        // },
                        outlineWidth: {
                            label: "Line Width",
                            value: settings.display.materials.outline.linewidth,
                            min: 0,
                            max: 10,
                            step: 0.001,
                            onChange: wControls.setOutlineWidth,
                        },
                    },
                    { collapsed: true }
                ),
                Dash: folder(
                    {
                        dashColor: {
                            label: "Color",
                            value: settings.display.materials.dash.color,
                            onChange: wControls.setDashColor,
                        },
                        // dashOpacity: {
                        //     label: "Opacity",
                        //     value: settings.display.materials.dash.opacity,
                        //     min: 0,
                        //     max: 1,
                        //     step: 0.001,
                        //     onChange: wControls.setDashOpacity,
                        // },
                        dashWidth: {
                            label: "Line Width",
                            value: settings.display.materials.dash.linewidth,
                            min: 0,
                            max: 10,
                            step: 0.001,
                            onChange: wControls.setDashLineWidth,
                        },
                        dashSize: {
                            label: "Dash",
                            min: 0,
                            max: 0.25,
                            step: 0.001,
                            value: settings.display.materials.dash.dashSize,
                            onChange: wControls.setDashDashSize,
                        },
                        gapSize: {
                            label: "Gap",
                            min: 0,
                            max: 0.25,
                            step: 0.001,
                            value: settings.display.materials.dash.gapSize,
                            onChange: wControls.setDashGapSize,
                        },
                    },
                    { collapsed: true }
                ),
                Projection: folder(
                    {
                        projectionColor: {
                            label: "Color",
                            value: settings.display.materials.projection.color,
                            onChange: wControls.setProjectionColor,
                        },
                        // projectionOpacity: {
                        //     label: "Opacity",
                        //     value: settings.display.materials.projection
                        //         .opacity,
                        //     min: 0,
                        //     max: 1,
                        //     step: 0.001,
                        //     onChange: wControls.setProjectionOpacity,
                        // },
                        projectionWidth: {
                            label: "Line Width",
                            value: settings.display.materials.projection
                                .linewidth,
                            min: 0,
                            max: 10,
                            step: 0.001,
                            onChange: wControls.setProjectionLineWidth,
                        },
                    },
                    { collapsed: true }
                ),
                Fold: folder(
                    {
                        foldColor: {
                            label: "Color",
                            value: settings.display.materials.fold.color,
                            onChange: wControls.setFoldColor,
                        },
                        // foldOpacity: {
                        //     label: "Opacity",
                        //     value: settings.display.materials.fold.opacity,
                        //     min: 0,
                        //     max: 1,
                        //     step: 0.001,
                        //     onChange: wControls.setFoldOpacity,
                        // },
                        foldWidth: {
                            label: "Line Width",
                            value: settings.display.materials.fold.linewidth,
                            min: 0,
                            max: 10,
                            step: 0.001,
                            onChange: wControls.setFoldLineWidth,
                        },
                        foldDistance: {
                            label: "Distance",
                            min: 0.5,
                            max: 5,
                            step: 0.01,
                            value: settings.display.materials.fold.foldDistance,
                            onChange: wControls.setFoldDistance,
                        },
                        foldSize: {
                            label: "Size",
                            min: 0,
                            max: 2,
                            step: 0.01,
                            value: settings.display.materials.fold.foldSize,
                            onChange: wControls.setFoldSize,
                        },
                    },
                    { collapsed: true }
                ),
                Section: folder(
                    {
                        sectionFaceColor: {
                            label: "Color",
                            value: settings.display.materials.sectionFace.color,
                            onChange: wControls.setSectionFaceColor,
                        },
                        // sectionFaceOpacity: {
                        //     label: "Face Opacity",
                        //     value: settings.display.materials.sectionFace
                        //         .opacity,
                        //     min: 0,
                        //     max: 1,
                        //     step: 0.001,
                        //     onChange: wControls.setSectionFaceOpacity,
                        // },
                        sectionEdgeColor: {
                            label: "Edge Color",
                            value: settings.display.materials.sectionEdge.color,
                            onChange: wControls.setSectionEdgeColor,
                        },
                        // sectionEdgeOpacity: {
                        //     label: "Edge Opacity",
                        //     value: settings.display.materials.sectionEdge
                        //         .opacity,
                        //     min: 0,
                        //     max: 1,
                        //     step: 0.001,
                        //     onChange: wControls.setSectionEdgeOpacity,
                        // },
                        sectionEdgeWidth: {
                            label: "Edge Width",
                            value: settings.display.materials.sectionEdge
                                .linewidth,
                            min: 0,
                            max: 10,
                            step: 0.001,
                            onChange: wControls.setSectionEdgeWidth,
                        },
                        sectionLineColor: {
                            label: "Line Color",
                            value: settings.display.materials.sectionLine.color,
                            onChange: wControls.setSectionColor,
                        },
                        // sectionLineOpacity: {
                        //     label: "Line Opacity",
                        //     value: settings.display.materials.sectionLine
                        //         .opacity,
                        //     min: 0,
                        //     max: 1,
                        //     step: 0.001,
                        //     onChange: wControls.setSectionLineOpacity,
                        // },
                        sectionLineWidth: {
                            label: "Line Width",
                            value: settings.display.materials.sectionLine
                                .linewidth,
                            min: 0,
                            max: 10,
                            step: 0.001,
                            onChange: wControls.setSectionLineWidth,
                        },
                    },
                    { collapsed: true }
                ),
            },
            { collapsed: true }
        )
        const Settings = folder(
            {
                theme: {
                    label: "Theme",
                    value: settings.display.theme,
                    options: themeOptions,
                    onChange: (value, path, context) => {
                        const result = (
                            wControls.themeSelect as (...args: any[]) => unknown
                        )(value, path, context)

                        if (result) {
                            setLevaTheme(settings.display.leva ?? {})
                        }

                        return result
                    },
                },

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
                Display,
            },
            { collapsed: true }
        )

        const Selection = folder({
            position: {
                value: {
                    x: 0,
                    z: 0,
                },
                min: -100,
                max: 100,
                step: 0.25, //step changes onChange call amount
                // lock: true,
                joystick: false,
                onEditStart(value, path, context) {
                    console.log(context)
                    // wPanelTool.onMoveStart(value, path, context)
                    if (context?.disabled) return
                    if (!context?.fromPanel) return
                    panelTool.onMoveStart(value)
                },
                onChange(value, path, context) {
                    // console.log(value)
                    // wPanelTool.onMove(value)
                    wPanelTool.onMove(value, path, context)
                    // if (context?.disabled) return
                    // if (!context?.fromPanel) return
                    // console.log("onChange")
                },
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
                onChange: wControls.scaleRootFromSelection,
            },
            "Add View": button(() => controls.addLeafToSelectedNodes()),
            "Delete View": button(() => controls.deleteSelectedNodes()),
            "Section Cut": button(() => controls.cutSelectedNodes()),
            "Mirror View": button(() => controls.mirrorSelectedNodes()),
            "Detach View": button(() => controls.detachAllSelectedNodes()),
            // "Detach View": button(() => controls.detachSelectedNodes()),
            // "Detach Children": button(() => controls.detachChildrenSelectedNodes() ),
            "Add Object to Library": button(() => controls.addSelectedNodesToLibrary()),

            "Boolean Union": button(() => controls.bUnionFromSeleciton(), {
                disabled: true,
            }),
            "Boolean Difference": button(
                () => controls.bDifferenceFromSeleciton(),
                { disabled: true }
            ),
            "Boolean Intersect": button(
                () => controls.bIntersectionFromSeleciton(),
                { disabled: true }
            ),
        })

        return {
            Insert: {
                value: "...",
                options: {
                    "...": "...",
                    ...geometryTitles,
                },
                onChange: (value: any) => {
                    // THREE.BufferGeometry | undefined
                    if (value === "...") return
                    controls.insertGeometry(value)
                },
            },
            // Import: button(() => {}, { disabled: true }),
            Selection,
            "Save Image": button(() => controls.downloadImage()),
            "Save SVG": button(() => controls.downloadSvg()),
            "Save Scene": button(() => controls.downloadSceneAsObj()),
            "Save Object": button(() => controls.downloadSelectedNodes()),
            Settings,
            ...(Debug ? { Debug } : {}),
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
                    drag: false, // Enable dragging
                    filter: false, // Enable filter/search
                    // position: { x: 0, y: 0 }, // Initial position (when drag is enabled)
                    // onDrag: () => {}, // Callback when dragged
                }}
                neverHide={true}
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
