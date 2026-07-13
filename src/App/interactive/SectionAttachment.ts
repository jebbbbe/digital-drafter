import type { SectionFaceGroup } from "../objects/attachments"

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
