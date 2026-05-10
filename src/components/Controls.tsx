import { controls } from "../App/index"
import { button, buttonGroup, folder, Leva, useControls } from "leva"
import { constants } from "../App/constants"

function Controls() {
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
                onChange: controls.setStatsVisible,
            },
            toggleCameraRotation: button(controls.toggleCameraRotation),
            rootScale: {
                label: "Root Scale",
                value: 1,
                min: 0.1,
                max: 4,
                step: 0.05,
                onChange: controls.setRootScaleMatrix,
            },
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
                onChange: controls.setSceneColor,
            },
            Mesh: folder(
                {
                    meshColor: {
                        label: "Color",
                        value: constants.display.mesh.color,
                        onChange: controls.setMeshColor,
                    },
                    meshVisible: {
                        label: "Visible",
                        value: constants.display.mesh.visible,
                        onChange: controls.setMeshVisible,
                    },
                },
                {}
            ),
            Line: folder({
                lineColor: {
                    label: "Color",
                    value: constants.display.line.color,
                    onChange: (a, b, c) => {
                        // console.log(a)
                        // console.log(b)
                        // console.log(c)
                        controls.setLineColor(a)
                    },
                },
                lineVisible: {
                    label: "Visible",
                    value: constants.display.line.visible,
                    onChange: controls.setLineVisible,
                },
                lineLinewidth: {
                    label: "Line Width",
                    value: constants.display.line.lineWidth,
                    min: 0,
                    max: 10,
                    step: 0.001,
                    onChange: controls.setLineWidth,
                },
            }),
            Dash: folder({
                dashColor: {
                    label: "Color",
                    value: constants.display.dash.color,
                    onChange: controls.setDashColor,
                },
                dashVisible: {
                    label: "Visible",
                    value: constants.display.dash.visible,
                    onChange: controls.setDashVisible,
                },
            }),
            Projection: folder({
                projectionColor: {
                    label: "Color",
                    value: constants.display.projection.color,
                    onChange: controls.setProjectionColor,
                },
                projectionVisible: {
                    label: "Visible",
                    value: constants.display.projection.visible,
                    onChange: controls.setProjectionVisible,
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
            onChange: controls.themeSelect,
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
        },
        rotate: {
            value: {
                x: 0,
                y: 0,
            },
            min: 0,
            max: 2 * Math.PI,
            disabled: true,
            onChange: controls.rotateRootFromSelection,
        },
        scale: {
            value: 1,
            min: 0.01,
            max: 5,
            disabled: true,
            onChange: controls.scaleRootFromSelection,
        },
        buttonGroup: buttonGroup({
            label: "",
            opts: {
                Add: controls.addLeafNearbyRandomlyFromSelection,
                Delete: controls.pruneNodeFromSelection,
                Cut: () => {},
                // Intersect: () => {},
            },
        }),
        // Hide: button(() => {}, { disabled: true }),
        // Delete: button(() => {}, { disabled: true }),
        // Add: button(() => {}, { disabled: true }),
        // Cut: button(() => {}, { disabled: true }),
        // Intersect: button(() => {}, { disabled: true }),
    })

    useControls({
        Debug,
        Actions,
        Display,
        "Reset Camera": button(controls.resetCamera),
        "Download Image": button(() => controls.downloadImage()),
        Settings,
        Import: button(() => {}, { disabled: false }),
        Stub,
    })

    return (
        <>
            <Leva
                // theme={myTheme} // you can pass a custom theme (see the styling section)
                // fill // default = false, true makes the pane fill the parent dom node it's rendered in
                // flat // default = false, true removes border radius and shadow
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
        </>
    )
}

export default Controls
