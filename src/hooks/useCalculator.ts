import { createContext, useContext, useEffect, useState } from 'react'

import { SessionManager } from '../lib/session'
import { WorkspaceManager } from '../lib/workspaces'

export const SessionContext = createContext((() => {
  const session = new SessionManager()
  const workspaces = new WorkspaceManager(session)

  return {
    session,
    workspaces,
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
 * @param disableListen Disable listening for mutations to the tree
 * @returns             A tree
 */
export function useCalculator (disableListen?: boolean): ContextType<typeof SessionContext> {
  const [, setSignal] = useState(0)
  const ctx = useContext(SessionContext)

  useEffect(() => {
    if (disableListen) return
    const aborter = new AbortController()
    ctx.tree.addEventListener('mutate', () => setSignal((prior) => prior + 1), { signal: aborter.signal, passive: true })

    return () => aborter.abort()
  }, [ctx, disableListen])

  return ctx
}
