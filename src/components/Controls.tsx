import { controls } from "../App/index"
import { button, Leva, useControls } from "leva"

function Controls() {
    useControls("Cube", {
        addNodeTest: button(controls.addNodeTest),
        addManyNodeTest: button(() => {
            for (let i = 0; i < 20; i++) {
                controls.addNodeTest()
            }
        }),
        resetCamera: button(controls.resetCamera),
        randomizeMeshColor: button(controls.randomizeMeshColor),
        toggleMesh: button(controls.toggleMesh),
        toggleLine: button(controls.toggleLine),
        saveCubeAsGlb: button(controls.saveCubeAsGlb),
        saveCubeAsGltf: button(controls.saveCubeAsGltf),
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
