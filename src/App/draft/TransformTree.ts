import * as THREE from "three"
import { InstanceCount, increaseCapacity, nearestCapacity } from "./capacity"

type InstanceLookup = {
    id: number
    index: number
}

// i think parent and children should be indexlookups, not refrences.
// if we do thatm it will need to be  children: InstanceLookup[] as we dont know id
type TransformNode = {
    pos: THREE.Vector3
    mat: THREE.Matrix4
    instanceLookup: InstanceLookup
    parent?: TransformNode
    children: TransformNode[]
}

// packed nodes, keep
type Bucket = {
    array: Array<TransformNode | undefined>
    count: number
    capacity: number
}

// getnode tree[id][transform]
// update matrix  instancces[instancelookup.id].updateMatrixat(mat, instancelookup.index)

// tree is held as node refences,
// for fast lookup with raycast, we will use a bucket per instance of nodes to match instance matrix lookup

export class TransformTree {
    buckets: Array<Bucket | undefined>

    constructor() {
        this.buckets = []
        this.addBucket()
    }

    /**
     * Retrieves a TransformNode from the tree using an instance lookup.
     *
     * @param lookup - Contains the bucket id and index of the instance.
     * @returns The matching TransformNode, or undefined if not found.
     *
     * @example
     * const node = tree.find({ id: 0, index: 5 });
     * if (node) {
     *   // use node
     * }
     */
    findNode(lookup: InstanceLookup): TransformNode | undefined {
        const bucket = this.buckets[lookup.id]
        if (!bucket) return
        if (lookup.index < 0 || lookup.index >= bucket.count) return

        return bucket.array[lookup.index]
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
    addNode(node: TransformNode, parent?: TransformNode) {
        if (parent) {
            node.parent = parent
            parent.children.push(node)
        }

        const { id } = node.instanceLookup
        if (id === -1) {
            console.error("node has no id, cant find bucket", node)
            return
        }

        const bucket = this.buckets[id]
        if (!bucket) {
            console.error("bucket not found for node.id", node)
            return
        }

        if (bucket.count === bucket.capacity) {
            this._reallocBucket(bucket)
        }

        const index = bucket.count
        bucket.array[index] = node
        node.instanceLookup.index = index
        bucket.count++

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
    pruneNode(node: TransformNode) {
        const { parent, children } = this.removeNode(node)
        if (parent === undefined) return
        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            child.parent = parent
            parent.children.push(child)
        }
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
    removeNode(node: TransformNode) {
        const { id, index } = node.instanceLookup
        const bucket = this.buckets[id]
        if (!bucket) {
            console.error("bucket not found for node", node)
            return { children: node.children, parent: node.parent }
        }

        const { array, count } = bucket
        const lastIndex = count - 1

        if (index < 0 || index >= count) {
            console.error("node index is outside the active bucket range", node)
            return { children: node.children, parent: node.parent }
        }

        const { parent, children } = node

        ;[array[lastIndex], array[index]] = [array[index], array[lastIndex]]
        array[index]!.instanceLookup.index = index

        array[lastIndex] = undefined
        bucket.count--

        if (parent) {
            const pc = parent.children
            const idx = pc.indexOf(node)
            if (idx !== -1) pc.splice(idx, 1)
        }

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
    addBucket(rootNode?: TransformNode) {
        let bucket: Bucket
        const id = this.buckets.length

        if (rootNode === undefined) {
            bucket = {
                array: new Array(InstanceCount),
                count: 0,
                capacity: InstanceCount,
            }
        } else {
            rootNode.instanceLookup.id = id
            rootNode.instanceLookup.index = 0
            bucket = {
                array: new Array(InstanceCount),
                count: 1,
                capacity: InstanceCount,
            }
            bucket.array[0] = rootNode
        }

        this.buckets.push(bucket)
        return this
    }

    /**
     * Loads a bucket from an existing packed node array.
     *
     * The bucket capacity is rounded up from the node count, and every node is
     * rewritten so its lookup matches the loaded bucket slot.
     *
     * @param nodes - Packed node array to load into a fresh bucket.
     * @returns The current tree for chaining.
     */
    loadBucket(nodes: TransformNode[]) {
        const id = this.buckets.length
        const capacity = nearestCapacity(nodes.length)
        const bucket: Bucket = {
            array: new Array(capacity),
            count: nodes.length,
            capacity,
        }

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i]
            node.instanceLookup.id = id
            node.instanceLookup.index = i
            bucket.array[i] = node
        }

        this.buckets.push(bucket)

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
        console.warn("do we need to worry about gaps in buckets array?")
        this.buckets[id] = undefined
        return this
    }

    /**
     * Reallocates a bucket to a larger capacity and copies the active node range.
     *
     * @param target - Bucket object or bucket id.
     */
    _reallocBucket(target: Bucket | number) {
        const bucket: Bucket =
            typeof target === "number" ? this.buckets[target]! : target
        const { array, count, capacity } = bucket
        const newCapacity = increaseCapacity(capacity)
        const next = new Array(newCapacity)
        for (let i = 0; i < count; i++) {
            next[i] = array[i]
        }
        bucket.capacity = newCapacity
        bucket.array = next
    }
}

export function createTransformNode(
    pos?: THREE.Vector3,
    mat?: THREE.Matrix4,
    id?: number,
    parent?: TransformNode
): TransformNode {
    const node: TransformNode = {
        pos: pos ?? new THREE.Vector3(),
        mat: mat ?? new THREE.Matrix4(),
        instanceLookup: {
            id: id ?? -1,
            index: -1,
        },
        children: [],
    }

    if (parent !== undefined) {
        node.parent = parent
        parent.children.push(node)
    }

    return node
}
