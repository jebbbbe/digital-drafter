import { isAppReady } from "../main"

import * as display from "./display.ts"
import * as camera from "./camera.ts"
import * as nodes from "./nodes.ts"
import * as save from "./export.ts"
import * as debug from "./debug.ts"

// this file automatically generates a guard on each imput for isAppReady

type AnyFn = (...args: any[]) => any
type ControlModule = Record<string, AnyFn>
type Controls = typeof display &
    typeof camera &
    typeof nodes &
    typeof save &
    typeof debug

const controls = {} as Controls

function guardImport(incoming: ControlModule) {
    for (const [name, fn] of Object.entries(incoming)) {
        let impl: typeof fn = ((...args: Parameters<typeof fn>) => {
            if (!isAppReady) return undefined as ReturnType<typeof fn>

            impl = fn
            return fn(...args)
        }) as typeof fn

        ;(controls as ControlModule)[name] = ((
            ...args: Parameters<typeof fn>
        ) => impl(...args)) as typeof fn
    }
}

guardImport(display as ControlModule)
guardImport(camera as ControlModule)
guardImport(nodes as ControlModule)
guardImport(save as ControlModule)
guardImport(debug as ControlModule)

export { controls }
