import * as THREE from "three"
import { InstanceCount, increaseCapacity, nearestCapacity } from "./capacity"
import { FreeList } from "../objects/FreeList"
import { PackedArray } from "../objects/PackedArray"

export type NodeLocation = {
    id: number
    index: number
}

export type Node<T = {}> = T & {
    location: NodeLocation
    parent: Node<T>
    children: Node<T>[]
}

/**
 * Packed transform tree keyed by instanced-mesh id and instance slot.
 *
 * Each bucket mirrors the active range of an instance matrix buffer so nodes can
 * be found with the same `{ id, index }` pair returned by raycasts or instance
 * bookkeeping. Parent and child links are stored as object references while the
 * packed buckets keep locaiton and removal fast.
 */
export class TransformTree {
    freelist: FreeList<PackedArray<Node>>
    roots = new Set<Node>()
    /**
     * Creates a tree with one empty bucket for instance id `0`.
     *
     * Additional instance ids are added with `addBucket()` as new instanced
     * meshes are introduced.
     */
    constructor() {
        this.freelist = new FreeList()
    }

    /**
     * Retrieves a Node from the tree using an instance locaiton.
     *
     * @param locaiton - Contains the bucket id and index of the instance.
     * @returns The matching Node, or undefined if not found.
     *
     * @example
     * const node = tree.find({ id: 0, index: 5 });
     * if (node) {
     *   // use node
     * }
     */
    findNode(locaiton: NodeLocation): Node | undefined {
        const array = this.freelist[locaiton.id]
        if (!array) return
        if (locaiton.index < 0 || locaiton.index >= array.count) return

        return array[locaiton.index]
    }

    /**
     * Inserts a node into its bucket and optionally links it under a parent.
     *
     * The node is always appended at the active end of the packed bucket array.
     * If a parent is provided, the node is linked from both sides of the tree.
     *
     * @param node - Node to insert.
     * @param parent - Optional parent for the inserted node.
     * @returns The inserted node.
     */
    addNode(node: Node, parent?: Node): Node | undefined {
        if (parent) {
            node.parent = parent
            parent.children.push(node)
        }

        const { id } = node.location
        if (id === -1) {
            console.error("node has no id, cant find bucket", node)
            return
        }

        const array = this.freelist[id]
        if (!array) {
            console.error("array not found for node.id", node)
            return
        }

        if (array.count === array.length) {
            this.resizeBucket(id)
        }

        const idx = array.push(node)
        if (idx === -1) console.error("addNode push error")
        node.location.index = idx

        return node
    }

    /**
     * Removes a node while keeping its children alive by reparenting them.
     *
     * If the node has a parent, its children are appended to that parent.
     * If it is a root node, its children are simply detached from that parent.
     *
     * @param node - Node to prune from the tree.
     */
    pruneNode(node: Node) {
        const removed = this.removeNode(node)
        if (removed === undefined) {
            console.error("Couldnt prune Node", node)
            return
        }
        const { parent, children } = removed
        if (parent === undefined) return
        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            child.parent = parent
            parent.children.push(child)
        }
        this.roots.delete(node)
    }

    /**
     * Removes a node from the packed bucket array with swap-remove.
     *
     * The last active node is moved into the removed slot so bucket indices stay
     * dense and continue to mirror instanced mesh slots.
     *
     * @param node - Node to remove.
     * @returns The node's previous parent and children for caller-side handling.
     */
    removeNode(node: Node): { children: Node[]; parent: Node } | undefined {
        const { id, index } = node.location
        const array = this.freelist[id]
        if (!array) {
            console.error("array not found for node", node)
            return
        }

        const { parent, children } = node

        // swap location
        array.remove(index)
        const swapped = array[index]
        if (swapped) swapped.location.index = index
        node.location.index = -1

        // remove node from parent
        if (parent) {
            const pc = parent.children
            const idx = pc.indexOf(node)
            if (idx !== -1) pc.splice(idx, 1)
        }
        this.roots.delete(node)


        return { children, parent }
    }

    /**
     * Adds a new packed bucket for transform nodes.
     *
     * If a seed node is provided, it becomes the first active node in the bucket.
     * Use `loadBucket()` to initialize a bucket from an existing node array.
     *
     * @param rootNode - Optional root node to seed the bucket with.
     * @returns The current tree for chaining.
     */
    addBucket(rootNode?: Node): number {
        const array = new PackedArray<Node>(InstanceCount)
        const id = this.freelist.nextIndex()
        if (rootNode !== undefined) {
            rootNode.location.id = id
            rootNode.location.index = 0
            array.push(rootNode)
        }

        this.freelist.push(array)
        return id
    }

    /**
     * Loads a bucket from an existing packed node array.
     *
     * The bucket capacity is rounded up from the node count, and every node is
     * rewritten so its locaiton matches the loaded bucket slot.
     *
     * @param nodes - Packed node array to load into a fresh bucket.
     * @returns The current tree for chaining.
     */
    loadBucket(nodes: Node[]) {
        const id = this.freelist.nextIndex()
        const capacity = nearestCapacity(nodes.length)
        const array = new PackedArray<Node>(capacity)

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i]
            node.location.id = id
            node.location.index = i
            array.push(node)
        }

        this.freelist.push(array)

        return this
    }

    /**
     * Removes a bucket slot without shifting later bucket ids.
     *
     * Bucket ids mirror instance ids, so removal leaves an empty bucket slot
     * instead of splicing the array.
     *
     * @param id - Bucket id to remove.
     * @returns The current tree for chaining.
     */
    removeBucket(id: number) {
        const removed = this.freelist[id]
        console.warn("not implemented fully, need to check children", removed)
        /*
        mock,
        go through all items in removed, if children has another id, remove that node. 
        remove roots when in another bucket,
        */
        this.freelist.remove(id)
        return this
    }

    /**
     * Reallocates a bucket to a larger capacity and copies the active node range.
     *
     * @param target - Bucket object or bucket id.
     */
    resizeBucket(id: number) {
        const array = this.freelist[id]
        if (!array) {
            console.error("Could not find array to resize, ", id)
            return
        }
        const newCapacity = increaseCapacity(array.count)
        array.resize(newCapacity)
    }
}
