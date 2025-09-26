import { useRef, useState } from 'react'

import { Tree } from '../lib/history'

/**
 * This is a hook that returns a proxied tree ref where every function call causes a rerender
 * @returns A tree
 */
export function useTree (): Tree {
  const [, setSignal] = useState(0)

  const tree = useRef((() => {
    const instance = new Tree()

    const proxy = new Proxy(instance, {
      get (target, p, receiver) {
        const value = Reflect.get(target, p, receiver)
        if (typeof value === 'function') {
          return (...args: any) => {
            setSignal((prior) => prior + 1)
            value.apply(target, args)
          }
        }

        return value
      }
    })

    return proxy
  })())

  return tree.current
}
