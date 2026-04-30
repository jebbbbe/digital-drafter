import { controls } from "../App/index"
import { button, folder, Leva, useControls } from "leva"

function Controls() {
    useControls({
        Actions: folder({
            "Add Test Node": button(controls.addTestNode),
            "Add Many Test Nodes": button(() => {
                for (let i = 0; i < 20; i++) {
                    controls.addTestNode()
                }
            }),
        }),
        Display: folder({
            Background: {
                label: "color",
                value: controls.defaultValues.display.background,
                onChange: controls.setSceneColor,
            },
            Mesh: folder({
                meshColor: {
                    label: "color",
                    value: controls.defaultValues.display.mesh.color,
                    onChange: controls.setMeshColor,
                },
                meshVisible: {
                    label: "visible",
                    value: controls.defaultValues.display.mesh.visible,
                    onChange: controls.setMeshVisible,
                },
            }),
            Line: folder({
                lineColor: {
                    label: "color",
                    value: controls.defaultValues.display.line.color,
                    onChange: controls.setLineColor,
                },
                lineVisible: {
                    label: "visible",
                    value: controls.defaultValues.display.line.visible,
                    onChange: controls.setLineVisible,
                },
            }),
            Projection: folder({
                projectionColor: {
                    label: "color",
                    value: controls.defaultValues.display.projection.color,
                    onChange: controls.setProjectionColor,
                },
                projectionVisible: {
                    label: "visible",
                    value: controls.defaultValues.display.projection.visible,
                    onChange: controls.setProjectionVisible,
                },
            }),
        }),
        Camera: folder(
            {
                resetCamera: button(controls.resetCamera),
                toggleCameraRotation: button(controls.toggleCameraRotation),
            },
            { collapsed: false }
        ),
        Export: folder(
            {
                saveCubeAsGlb: button(controls.saveCubeAsGlb),
                saveCubeAsGltf: button(controls.saveCubeAsGltf),
            },
            { collapsed: true }
        ),
        Debug: folder({}, { collapsed: true }),
        "Download Image": button(() => controls.downloadImage()),
    })

    return (
        <>
            <Leva
                // theme={myTheme} // you can pass a custom theme (see the styling section)
                // fill // default = false, true makes the pane fill the parent dom node it's rendered in
                // flat // default = false, true removes border radius and shadow
                // oneLineLabels // default = false, alternative layout for labels, with labels and fields on separate rows
                // hideTitleBar // default = false, hides the GUI header
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
                    onDrag: (position) => {}, // Callback when dragged
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
