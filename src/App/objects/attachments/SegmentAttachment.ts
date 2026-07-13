import { SectionCutter } from "./SectionCutter"

export type SegmentAttachment = {
    object: SectionCutter
    index: number
}

export function createSegmentAttachment(
    object: SectionCutter,
    index: number
): SegmentAttachment {
    return {
        object,
        index,
    }
}
