import { createContext, useContext, useEffect, useState } from 'react'

import { SessionManager } from '../lib/session'

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
    ctx.tree.addEventListener('mutate', () => setSignal((prior) => prior + 1), { signal: aborter.signal, passive: true })

    return () => aborter.abort()
  }, [ctx])

  return ctx
}
