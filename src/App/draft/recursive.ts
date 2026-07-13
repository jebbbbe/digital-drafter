import type { NodeLocation } from "./TransformTree"
import type { TransformNode } from "../objects/attachments"

export function walkSubtree(
    root: TransformNode,
    visit: (node: TransformNode, ...args: any[]) => void
): void {
    const stack: TransformNode[] = [root]

    while (stack.length > 0) {
        const node = stack.pop()!
        visit(node)

        const { children } = node
        for (let i = children.length - 1; i >= 0; i--) {
            stack.push(children[i])
        }
    }
}

export function walkSeenSubtree(
    root: TransformNode,
    seen: Set<TransformNode>,
    visit: (node: TransformNode, ...args: any[]) => void
): void {
    if (seen.has(root)) return
    const stack: TransformNode[] = [root]
    while (stack.length > 0) {
        const node = stack.pop()!
        seen.add(node)
        visit(node)

        const { children } = node
        for (let i = children.length - 1; i >= 0; i--) {
            if (seen.has(children[i])) continue
            stack.push(children[i])
        }
    }
}

export function getSubTreeProps(
    root: TransformNode,
    prop: keyof TransformNode
): { location: NodeLocation; prop: any }[] {
    const out: { location: NodeLocation; prop: any }[] = []
    walkSubtree(root, (node) => {
        out.push({
            location: node.location,
            prop: node[prop],
        })
    })
    return out
}

/**
 * Returns true when reparenting `node` under `nextParent` would create a cycle.
 *
 * This is used before mutating tree links so recursive subtree walks remain
 * finite.
 */
export function createsCycle(
    node: TransformNode,
    nextParent: TransformNode
): boolean {
    let current: TransformNode = nextParent

    while (true) {
        if (current === node) {
            return true
        }

        if (current.parent === current) {
            return false
        }

        current = current.parent
    }
}
