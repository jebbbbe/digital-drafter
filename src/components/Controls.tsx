import { controls } from "../App/index"
import { button, folder, Leva, useControls } from "leva"
import { settings } from "../App/settings"
function Controls() {
    const Actions = folder({
        "Add Test Node": button(() => controls.addTestNode()),
        "Add Many Test Nodes": button(() => {
            for (let i = 0; i < 20; i++) {
                controls.addTestNode(100, 100)
            }
        }),
    })

    const Display = folder({
        Background: {
            label: "color",
            value: settings.display.background,
            onChange: controls.setSceneColor,
        },
        Mesh: folder({
            meshColor: {
                label: "color",
                value: settings.display.mesh.color,
                onChange: controls.setMeshColor,
            },
            meshVisible: {
                label: "visible",
                value: settings.display.mesh.visible,
                onChange: controls.setMeshVisible,
            },
        }),
        Line: folder({
            lineColor: {
                label: "color",
                value: settings.display.line.color,
                onChange: controls.setLineColor,
            },
            lineVisible: {
                label: "visible",
                value: settings.display.line.visible,
                onChange: controls.setLineVisible,
            },
        }),
        Projection: folder({
            projectionColor: {
                label: "color",
                value: settings.display.projection.color,
                onChange: controls.setProjectionColor,
            },
            projectionVisible: {
                label: "visible",
                value: settings.display.projection.visible,
                onChange: controls.setProjectionVisible,
            },
        }),
    })

    const Camera = folder(
        {
            resetCamera: button(controls.resetCamera),
            toggleCameraRotation: button(controls.toggleCameraRotation),
        },
        { collapsed: false }
    )

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
            rootScale: {
                label: "Root Scale",
                value: 1,
                min: 0.1,
                max: 4,
                step: 0.05,
                onChange: controls.setRootScaleMatrix,
            },
        },
        { collapsed: true }
    )

    useControls({
        Actions,
        Display,
        Camera,
        Export,
        Debug,
        "Download Image": button(() => controls.downloadImage()),
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
