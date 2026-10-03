import * as THREE from "three"
import type { GizmoSettings, PanelSettings } from "@types"
import { InteractiveObject } from "./InteractiveObject"
import type { NEWSectionCutter } from "./sl"
import { controllers } from "../AppContext"
import { updatePanel } from "../../components/Leva/LevaStore"

export class SectionCutterInstance extends InteractiveObject {
    private readonly originalColor = new THREE.Color()
    cutter: NEWSectionCutter
    index: number

    constructor(cutter: NEWSectionCutter, index: number) {
        super()
        this.cutter = cutter
        this.index = index
    }

    override move(_startHit: THREE.Vector3) {
        return undefined
    }

    override getCenter() {
        const mesh = this.cutter.mesh
        mesh.updateWorldMatrix(true, false)
        return new THREE.Vector3()
            .setFromMatrixPosition(this.cutter.getMatrix(this.index))
            .applyMatrix4(mesh.matrixWorld)
    }

    override gizmoSetup(settings: Partial<GizmoSettings>) {
        controllers.setGizmoSettings({
            anchor: new THREE.Vector3(),
            center: this.getCenter(),
            quaternion: new THREE.Quaternion(),
            preset: "translate",
            ...settings,
        })
    }

    override panelSetup(settings: Partial<PanelSettings>) {
        updatePanel({
            position: this.getCenter(),
            rotation: { x: 0, y: 0 },
            scale: 1,
            usePosition: true,
            useRotation: false,
            useScale: false,
            useButtons: false,
            ...settings,
        })
    }

    override gizmoListener(position = controllers.getGizmoPosition()) {
        if (this.index < 0) return
        const mesh = this.cutter.mesh
        const matrix = this.cutter.getMatrix(this.index)
        matrix.setPosition(mesh.worldToLocal(position.clone()))
        mesh.setMatrixAt(this.index, matrix)
    }

    override setSelected(isSelected: boolean) {
        if (this.index < 0 || this.selected === isSelected) return
        const mesh = this.cutter.mesh
        if (isSelected) {
            if (mesh.instanceColor)
                mesh.getColorAt(this.index, this.originalColor)
            else this.originalColor.set(0xffffff)
        }
        this.selected = isSelected
        mesh.setColorAt(
            this.index,
            isSelected ? new THREE.Color(0xffaa00) : this.originalColor
        )
    }

    override delete() {
        if (this.index < 0) return
        this.cutter.deleteInstance(this.index)
        this.selected = false
        this.index = -1
    }
}
