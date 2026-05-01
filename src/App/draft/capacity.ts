// default Instance Count
export const InstanceCount = 512

// patern for geting larger capcity, must match between Instance and tree nodes
export function increaseCapacity(cap: number = InstanceCount): number {
    return cap * 2
}

export function nearestCapacity(count: number): number {
    let cnt = InstanceCount
    while (count > cnt) {
        cnt = increaseCapacity(cnt)
    }
    return cnt
}
