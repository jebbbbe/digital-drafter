import type { NodeLocation } from "./TransformTree"
import type { TransformNode } from "./TransformNode"

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
