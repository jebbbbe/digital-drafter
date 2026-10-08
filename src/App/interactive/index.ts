import type { TransformNode } from "./TransformNode"
import type { SegmentAttachment } from "./SegmentAttachment"
import type { InteractiveMesh } from "./InteractiveMesh"
import type { InteractiveInstancedMesh } from "./InteractiveInstancedMesh"

export type InteractiveTarget =
    | TransformNode
    | SegmentAttachment
    | InteractiveMesh
    | InteractiveInstancedMesh

export { TransformNode, createTransformNode } from "./TransformNode"
export { SegmentAttachment, createSegmentAttachment } from "./SegmentAttachment"
export type { InteractiveObject } from "./InteractiveObject"
export { SectionCutter } from "./SectionCutter"
export { SectionAttachment, createSectionAttachment } from "./SectionAttachment"
export { InteractiveMesh } from "./InteractiveMesh"
export { InteractiveInstancedMesh } from "./InteractiveInstancedMesh"
export { getInteractiveObject } from "./getInteractiveObject"
