import type { TransformNode } from "@types"
import type { CSGOperation } from "three-bvh-csg"

export class BooleanOperationManager {
    primary!: TransformNode
    operation!: CSGOperation
    addends: Set<TransformNode>
    result!: TransformNode
    needsUpdate: boolean
    constructor(
        primary: TransformNode,
        addends: TransformNode[],
        operation: CSGOperation
    ) {
        this.primary = primary
        this.operation = operation
        this.addends = new Set(addends)
        this.needsUpdate = true
    }
    /**
     * re-evaluates the result node
     */
    evaluateResult() {
        if (!this.needsUpdate) return
        // eval logic...
        this.needsUpdate = false
    }
    /**
     * change operation and reevaluate.
     * not suppoerted
     */
    changeOperation(newOperation: CSGOperation) {
        if (newOperation == this.operation) return
        this.evaluateResult()
    }
    /**
     * node in operation.
     */
    has(node: TransformNode): boolean {
        if (this.primary === node) return true
        else if (this.result === node) return true
        else if (this.addends.has(node)) return true
        else return false
    }
    /**
     * add a node to the addend set
     */
    addAddend(node: TransformNode) {
        // this.addends.add(node)
        // update node props...
        // update intersection..?
    }
    /**
     * remove node form addends
     * delete the calss if no nodes in set...
     */
    removeAddend() {}
    /**
     * result node deleted, remove class from circulation
     */
    removePrimary() {}
    /**
     * result node deleted, remove class from circulation
     */
    removeResult() {}
    /**
     * delete the ref and all node metadata
     */
    delete() {}
}
