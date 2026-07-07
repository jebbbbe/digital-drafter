import * as THREE from "three"
import { TransformTree } from "./TransformTree"
import { FreeList } from "../objects/FreeList"
import { GlobalTreeTexture } from "../objects/textures/GlobalTreeTexture"
import { SectionCutter } from "../objects/attachments"
import {
    createTransformNode,
    rebaseDetachedMatrixNodeToRoot,
} from "./TransformNode"
import { calculateBaseMatrix, calculateCompoundMatrix } from "./matrix"
import { InstanceItem } from "./InstanceItem"
import { walkSubtree, walkSeenSubtree } from "./recursive"
import { matlib } from "./materialManager"
import type { TransformNode } from "./TransformNode"
import type { NodeLocation } from "./TransformTree"

const _anchoredCenter = new THREE.Vector3()

export class Drafter {
    tree = new TransformTree()
    instanceItems: FreeList<InstanceItem> = new FreeList()
    interactiveObjects: THREE.Object3D[] = []
    scene!: THREE.Scene
    globalTreeTexture = new GlobalTreeTexture({})
    materials = {
        ...matlib,
        debugLine: new THREE.LineBasicMaterial({
            color: 0xffff00,
        }),
        debugPoint: new THREE.PointsMaterial({
            color: 0xffff00,
        }),
    }
    debug = {
        objects: {
            line: new THREE.Line(),
            point: new THREE.Points(),
            section: new THREE.Mesh(),
        },
        enable: false,
    }
    sectionCutter = new SectionCutter(this.materials.sectionLine)
    constructor(scene: THREE.Scene, debug: boolean = false) {
        this.scene = scene
        this.assignTexture()
        this.debug.enable = debug
        if (debug) this.setUpDebug()
        const mesh = this.sectionCutter.mesh
        this.scene.add(mesh)
        this.interactiveObjects.push(mesh)
    }
    assignTexture() {
        const text = this.globalTreeTexture.texture
        const size = this.globalTreeTexture.textureSize

        this.materials.mesh.treeData = text
        this.materials.line.treeData = text
        this.materials.outline.treeData = text
        this.materials.dash.treeData = text
        this.materials.projection.treeData = text
        this.materials.fold.treeData = text
        this.materials.mesh.treeDataSize = size
        this.materials.line.treeDataSize = size
        this.materials.outline.treeDataSize = size
        this.materials.dash.treeDataSize = size
        this.materials.projection.treeDataSize = size
        this.materials.fold.treeDataSize = size
    }

    setUpDebug() {
        this.debug.enable = true
        this.debug.objects.line.material = this.materials.debugLine
        this.debug.objects.point.material = this.materials.debugPoint

        const boxDebug = new THREE.Mesh(
            this.sectionCutter.box,
            new THREE.MeshBasicMaterial({
                color: 0x00ffff,
            })
        )
        boxDebug.matrixAutoUpdate = false
        this.debug.objects.section = boxDebug
        this.scene.add(boxDebug)
    }
    getInstance(id: number): InstanceItem {
        const instanceItem = this.instanceItems[id]
        if (!instanceItem) {
            throw new Error(`Missing InstanceItem for id ${id}`)
        }
        return instanceItem
    }
    newInstance(geometry: THREE.BufferGeometry): InstanceItem | undefined {
        // get next avaliable index from freelist
        const id = this.instanceItems.nextIndex()
        //reserve space
        const grew = this.globalTreeTexture.incBlockCount()
        if (grew === -1) {
            console.error("reached max Instances")
            return
        }
        if (grew) this.assignTexture()
        // create new InstanceItem
        const newInstanceItem = new InstanceItem(geometry, this.materials, id)
        // add Geo to the Scene
        this.scene.add(newInstanceItem.group)
        // push to Freelist, should arrive at id
        this.instanceItems.push(newInstanceItem)
        // push to interactive objects
        this.interactiveObjects.push(newInstanceItem.instances.mesh)
        // create new node freelist bucket, id should match the instanceitems
        const treeId = this.tree.addBucket()
        if (id !== treeId) {
            console.error("id missmatch on new instance", id, treeId)
        }

        return newInstanceItem
    }

    patchInstanceGeometry(
        id: number,
        geometry: THREE.BufferGeometry
    ): InstanceItem | undefined {
        // get item
        const instanceItem = this.getInstance(id)
        return instanceItem.patch(geometry)
    }

    getNodesAnchoredCenter(
        node: TransformNode,
        target: THREE.Vector3 = _anchoredCenter
    ) {
        const instanceItem = this.getInstance(node.location.id)
        target.copy(instanceItem.anchor).applyMatrix4(node.compoundMatrix)
        target.sub(node.position)
        target.y = 0
        return target
    }

    findReusableInstance(
        geometry: THREE.BufferGeometry,
        preferredId?: number
    ): { id: number; instanceItem: InstanceItem } | undefined {
        if (preferredId !== undefined) {
            const preferred = this.instanceItems[preferredId]
            if (
                preferred &&
                preferred.geometry === geometry &&
                preferred.count < preferred.maxCount
            ) {
                return { id: preferredId, instanceItem: preferred }
            }
        }

        for (let id = 0; id < this.instanceItems.length; id++) {
            const instanceItem = this.getInstance(id)
            if (instanceItem.geometry !== geometry) continue
            if (instanceItem.count >= instanceItem.maxCount) continue
            return { id, instanceItem }
        }
    }

    removeInstance(id: number) {
        // get item
        const instanceItem = this.getInstance(id)

        // clean up other refrences
        this.scene.remove(instanceItem.group)
        const rm = this.interactiveObjects.indexOf(instanceItem.instances.mesh)
        if (rm !== -1) {
            this.interactiveObjects.splice(rm, 1)
        }
        // remove from both freelists,
        this.instanceItems.remove(id)
        this.tree.removeBucket(id)
        this.globalTreeTexture.decBlockCount()
    }
    findNode(location: NodeLocation) {
        const node = this.tree.findNode(location) as TransformNode | undefined
        return node
    }

    addRootNode(rootNode: Partial<TransformNode>) {
        // get id for insertion
        const id = rootNode?.location?.id
        if (id === undefined || rootNode?.location === undefined) {
            console.log("rootnode missing location", rootNode)
            return
        }

        let instanceItem = this.instanceItems[id]
        if (!instanceItem) {
            console.error("couldnt find instanceItem at id", rootNode)
            return
        }

        if (instanceItem.count === instanceItem.maxCount) {
            const reusable = this.findReusableInstance(
                instanceItem.geometry,
                id
            )
            if (reusable) {
                rootNode.location.id = reusable.id
                instanceItem = reusable.instanceItem
            } else {
                // create new Instance object with same props...
                rootNode.location.id = this.instanceItems.nextIndex()
                instanceItem = this.newInstance(instanceItem.geometry)
                if (!instanceItem) {
                    return
                }
            }
        }
        // set type
        rootNode.type = "root"

        // make node
        const node = createTransformNode(rootNode)
        // add node to tree
        this.tree.addNode(node)
        // add node to root set
        this.tree.roots.add(node)

        // increment count
        instanceItem.incrementInstanceCount()
        this.updatePatchedNode(node)
        return node
    }

    // i dont like parentLocation, switch to passing another node...
    addLeafNode(
        partialNode: Partial<TransformNode>,
        parentLocation: NodeLocation | TransformNode = { id: -1, index: -1 }
    ): TransformNode | undefined {
        const parentNodeLocation =
            "location" in parentLocation
                ? parentLocation.location
                : parentLocation
        // copy parents location to partialNode, unless we defined it already
        // this is so we can add Nodes that use a different id
        if (partialNode.location?.id === undefined) {
            partialNode.location = {
                id: parentNodeLocation.id,
                index: partialNode.location?.index ?? -1,
            }
        }

        const id = partialNode.location.id
        let instanceItem = this.instanceItems[id]
        if (!instanceItem) {
            console.error("couldnt find instanceItem at id", partialNode)
            return
        }

        if (instanceItem.count === instanceItem.maxCount) {
            const reusable = this.findReusableInstance(
                instanceItem.geometry,
                id
            )
            if (reusable) {
                partialNode.location.id = reusable.id
                instanceItem = reusable.instanceItem
            } else {
                // create new Instance object with same props...
                partialNode.location.id = this.instanceItems.nextIndex()
                instanceItem = this.newInstance(instanceItem.geometry)
                if (!instanceItem) {
                    return
                }
            }
        }

        const node = createTransformNode(partialNode)
        const parent = this.tree.findNode(parentNodeLocation)
        this.tree.addNode(node, parent)

        instanceItem.incrementInstanceCount()
        this.updatePatchedNode(node)

        return node
    }

    pruneNode(target: TransformNode | NodeLocation) {
        //get location
        const location = "location" in target ? target.location : target
        const id = location.id
        //get instanceItem
        const instanceItem = this.getInstance(id)

        //get node
        const node = this.tree.findNode(location) as TransformNode | undefined
        if (!node) return

        //remove attachments
        const segmentAttachment = node.attachments.segment
        if (segmentAttachment !== undefined) {
            node.attachments.segment = undefined
            this.sectionCutter.deleteSegment(segmentAttachment.index)
        }

        const faceAttachment = node.attachments.section
        if (faceAttachment !== undefined) {
            node.attachments.section = undefined
            faceAttachment.object.dispose()
        }

        //isRoot branch
        const isRoot = node === node.parent
        if (isRoot) {
            this.removeNode(node)
            return
        }

        const removedIndex = node.location.index
        const parentLocation = node.parent.location
        const parentNode = this.tree.findNode(parentLocation) as TransformNode
        const lastActiveIndex = instanceItem.count - 1
        const swappedNode =
            removedIndex === lastActiveIndex
                ? undefined
                : (this.tree.getBucket(id)?.[lastActiveIndex] as
                      | TransformNode
                      | undefined)

        // reparent the children
        this.tree.pruneNode(node)
        instanceItem.decrementInstanceCount()

        if (swappedNode) {
            // The packed tree moved this node into the removed slot, so rewrite
            // its instance data using the node's new location.
            this.updatePatchedNode(swappedNode)
        }
        this.updatePatchedNode(parentNode)
    }

    removeNode(target: TransformNode | NodeLocation) {
        const location = "location" in target ? target.location : target
        const node = this.tree.findNode(location) as TransformNode | undefined
        if (!node) return

        const subtree: TransformNode[] = []
        walkSubtree(node, (subtreeNode) => {
            subtree.push(subtreeNode)
        })

        const touchedIds = new Set<number>()
        const emptyIds = new Set<number>()
        const movedNodes = new Set<TransformNode>()

        for (let i = subtree.length - 1; i >= 0; i--) {
            const subtreeNode = subtree[i]
            const id = subtreeNode.location.id
            const instanceItem = this.getInstance(id)

            const removedIndex = subtreeNode.location.index
            const lastActiveIndex = instanceItem.count - 1
            const swappedNode =
                removedIndex === lastActiveIndex
                    ? undefined
                    : (this.tree.getBucket(id)?.[lastActiveIndex] as
                          | TransformNode
                          | undefined)

            this.tree.removeNode(subtreeNode)
            instanceItem.decrementInstanceCount()
            touchedIds.add(id)

            if (instanceItem.count === 0) {
                emptyIds.add(id)
                continue
            }

            if (swappedNode) {
                movedNodes.add(swappedNode)
            }
        }

        for (const id of emptyIds) {
            this.removeInstance(id)
            touchedIds.delete(id)
        }

        for (const movedNode of movedNodes) {
            this.updatePatchedNode(movedNode)
        }

        for (const id of touchedIds) {
            const instanceItem = this.getInstance(id)
            instanceItem.computeBoundingSphere()
        }
        return Array.from(emptyIds)
    }

    detachNode(target: TransformNode | NodeLocation) {
        const location = "location" in target ? target.location : target
        const node = this.tree.findNode(location) as TransformNode | undefined
        if (!node) return
        const isRoot = node === node.parent
        // already an orphan
        if (isRoot) return

        const instanceItem = this.getInstance(location.id)

        const parent = node.parent
        const siblings = parent.children
        const idx = siblings.indexOf(node)
        if (idx === -1) return
        // remove parent
        siblings.splice(idx, 1)
        node.parent = node
        node.type = "root"

        // make base matrix match root pattern
        rebaseDetachedMatrixNodeToRoot(node, instanceItem.localTransform)

        // we dont really need to do dfs as node didnt move...
        // this.updatePatchedNode(node)the
        // we do need to update teh texture to make the proj lines go away
        this.globalTreeTexture.setNodeTextureAt(node)
    }
    /* path node props directly before passing, this updates draw geo*/
    updatePatchedNode(patchedNode: TransformNode) {
        const instanceItem = this.getInstance(patchedNode.location.id)

        calculateBaseMatrix(patchedNode)
        //update childrens base matrix as it depends on parent pos.

        const subtree: TransformNode[] = []
        const fn = (n: TransformNode) =>
            calculateCompoundMatrix(n, subtree, instanceItem.localTransform)

        walkSubtree(patchedNode, fn)

        const sphereUpdate = {} as Record<number, InstanceItem>
        // update buffers of subtree
        for (let i = 0; i < subtree.length; i++) {
            const node = subtree[i]
            const id = node.location.id
            const instanceItem = this.getInstance(id)
            const slot = this.globalTreeTexture.setNodeTextureAt(node)
            instanceItem.setInstanceBuffersIndex(node, slot)
            sphereUpdate[id] = instanceItem
        }

        //  update bounding sphere of seen instanceItems
        for (const key in sphereUpdate) {
            sphereUpdate[key].computeBoundingSphere()
        }
    }
    updatePatchedNodeArray(nodePatchArray: TransformNode | TransformNode[]) {
        if (!Array.isArray(nodePatchArray)) {
            nodePatchArray = [nodePatchArray]
        }

        // out nodes are always unique
        // nodePatchArray = [...new Set(nodePatchArray)]

        for (let i = 0; i < nodePatchArray.length; i++) {
            calculateBaseMatrix(nodePatchArray[i])
        }

        // can we keep track of this on each node..?
        const depth = (node: TransformNode) => {
            let count = 0
            let current = node
            while (current !== current.parent) {
                count++
                current = current.parent
            }
            return count
        }
        nodePatchArray.sort((a, b) => depth(a) - depth(b))

        const seen = new Set<TransformNode>()
        const subtree: TransformNode[] = []
        const sphereUpdate = {} as Record<number, InstanceItem>

        for (let i = 0; i < nodePatchArray.length; i++) {
            const patchedNode = nodePatchArray[i]
            if (seen.has(patchedNode)) continue

            const instanceItem = this.getInstance(patchedNode.location.id)

            const fn = (n: TransformNode) => {
                calculateCompoundMatrix(n, subtree, instanceItem.localTransform)
            }

            walkSeenSubtree(patchedNode, seen, fn)
        }

        // update buffers of the accumulated subtree
        for (let i = 0; i < subtree.length; i++) {
            const node = subtree[i]
            const id = node.location.id
            const instanceItem = this.getInstance(id)
            const slot = this.globalTreeTexture.setNodeTextureAt(node)
            instanceItem.setInstanceBuffersIndex(node, slot)
            sphereUpdate[id] = instanceItem
        }

        // update bounding sphere of seen instanceItems
        for (const key in sphereUpdate) {
            sphereUpdate[key].computeBoundingSphere()
        }
    }
}
