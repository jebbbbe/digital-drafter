import type { SectionFaceGroup } from "@types"

export type SectionAttachment = {
    object: SectionFaceGroup
}

export function createSectionAttachment(
    object: SectionFaceGroup
): SectionAttachment {
    return {
        object,
    }
}
