import { createContext, useContext, useEffect, useState } from 'react'

import { Tree } from '../lib/history'
import { HistoryCalculator } from '../lib/calculator'

export const HistoryContext = createContext((() => {
  const tree = new Tree()
  return {
    tree,
    calculator: new HistoryCalculator(tree)
  }
})())

/**
 * This is a hook that returns the history context, subscribed to mutations for updates
 * @returns A tree
 */
export function useCalculator (): { tree: Tree, calculator: HistoryCalculator } {
  const [signal, setSignal] = useState(0)
  const ctx = useContext(HistoryContext)

  console.debug('signal', signal)

  useEffect(() => {
    const aborter = new AbortController()
    ctx.tree.addEventListener('mutate', () => setSignal((prior) => prior + 1), { signal: aborter.signal })

    return () => aborter.abort()
  }, [ctx])

  return ctx
}
