import { createContext, useContext, useEffect, useState } from 'react'

import { Tree } from '../lib/history'
import { HistoryCalculator } from '../lib/calculator'
import { SessionManager } from '../lib/session'

type ContextType<T> = T extends React.Context<infer U> ? U : never

export const SessionContext = createContext((() => {
  const session = new SessionManager()

  return {
    session,
    get tree () {
      return session.tree
    },
    get calculator () {
      return session.calculator
    }
  }
})())

/**
 * This is a hook that returns the history context, subscribed to mutations for updates
 * @returns A tree
 */
export function useCalculator (): ContextType<typeof SessionContext> {
  const [, setSignal] = useState(0)
  const ctx = useContext(SessionContext)

  useEffect(() => {
    const aborter = new AbortController()
    ctx.tree.addEventListener('mutate', () => setSignal((prior) => prior + 1), { signal: aborter.signal })

    return () => aborter.abort()
  }, [ctx])

  return ctx
}
