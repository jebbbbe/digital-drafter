import * as controls from "../App/controls"

function Controls() {
    const handleChangeCubeColor = () => {
        controls.randomizeCubeColor()
    }
    const handleChangeCubeToggle = () => {
        controls.toggleCube()
    }
    const handleSaveCubeAsGlb = () => {
        controls.saveCubeAsGlb()
    }

    return (
        <>
            <button type="button" onClick={handleChangeCubeColor}>
                Randomize cube color
            </button>
            <button type="button" onClick={handleChangeCubeToggle}>
                Toggle cube
            </button>
            <button type="button" onClick={handleSaveCubeAsGlb}>
                Save cube as .glb
            </button>
            <button type="button" onClick={controls.saveCubeAsGltf}>
                Save cube as .gltf
            </button>
        </>
    )
}

export default Controls
