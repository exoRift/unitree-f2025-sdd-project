import { useEffect, useRef, useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { twMerge } from 'tailwind-merge'

import { SettingsProvider, useSettings } from './hooks/useSettings'
import { SessionContext, useCalculator } from './hooks/useCalculator'
import { SessionManager } from './lib/session'
import { HistoryTree } from './components/HistoryTree'
import { HistoryCalculator } from './lib/calculator'

import { Toolbar } from './components/Toolbar'
import { Calculator } from './components/Calculator'
import { WorkspaceManager } from './lib/workspaces'

/**
 * A stylized resize handle
 */
function ResizeHandle (): React.ReactNode {
  return (
    <PanelResizeHandle className='relative flex w-px hover:outline outline-1 outline-border items-center justify-center bg-accent after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90'>
      <div className='z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-accent'>
        <div className='symbol text-xl'>drag_indicator</div>
      </div>
    </PanelResizeHandle>
  )
}

/**
 * A save icon to be displayed when saving the session state
 */
function SaveIcon (): React.ReactNode {
  const { session } = useCalculator(true)

  const [shown, setShown] = useState(false)

  useEffect(() => {
    const aborter = new AbortController()

    session.addEventListener('saving', () => setShown(true), { signal: aborter.signal, passive: true })
    session.addEventListener('saved', () => setShown(false), { signal: aborter.signal, passive: true })

    return () => aborter.abort()
  }, [session])

  return (
    <div className='fixed bottom-2 left-2'>
      <div className={twMerge('transition symbol animate-spin', shown ? 'opacity-100' : 'opacity-0')}>save</div>
    </div>
  )
}

/**
 * Contains application components
 * @returns Unitree layout equipped with the Toolbar, History-Tree, resizable panel divider, and
 *  Calculator
 */
function App (): React.ReactNode {
  const { settings } = useSettings()

  return (
    <div className='min-h-screen grid grid-rows-[auto_1fr] grid-cols-1'>
      <Toolbar />

      <PanelGroup autoSaveId='treecalcsplit' direction={settings.orientation}>
        <Panel id='historytree' minSize={15}>
          <HistoryTree />
        </Panel>
        <ResizeHandle />
        <Panel id='calculator' minSize={40} defaultSize={50}>
          <Calculator />
        </Panel>
      </PanelGroup>

      <SaveIcon />
    </div>
  )
}

/**
 * The main app
 */
export default function Session (): React.ReactNode {
  const ctx = useRef((() => {
    const session = new SessionManager()
    session.recall()
    const workspaces = new WorkspaceManager(session)
    workspaces.loadFromStorage()
    const tree = session.tree
    const calculator = new HistoryCalculator(tree)
    return { session, workspaces, tree, calculator }
  })())

  useEffect(() => {
    const ctxVal = ctx.current
    ctxVal.session.startAutosaving()

    return () => ctxVal.session.stopAutosaving()
  }, [])

  return (
    <SessionContext.Provider value={ctx.current}>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </SessionContext.Provider>
  )
}
