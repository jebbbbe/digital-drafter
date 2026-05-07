const randFn = Math.random

type NonEmptyArray<T> = readonly [T, ...T[]]

/**
 * Returns a random floating-point number within the given range.
 * @param a Inclusive lower bound.
 * @param b Exclusive upper bound.
 */
export function random(a = 0, b = 1) {
    const min = Math.min(a, b)
    const max = Math.max(a, b)
    return min + randFn() * (max - min)
}

/**
 * Returns a random integer within the given range.
 * @param a Inclusive lower bound.
 * @param b Inclusive upper bound.
 */
export function randomInt(a = 0, b = 1) {
    const min = Math.ceil(Math.min(a, b))
    const max = Math.floor(Math.max(a, b))
    return Math.floor(random(min, max + 1))
}

/**
 * Returns a random item from an array.
 */
export function randomItem<T>(items: NonEmptyArray<T>): T {
    return items[randomInt(0, items.length - 1)]
}
