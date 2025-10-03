import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

import { createContext } from 'react'
import { Tree } from './lib/history'
import { useTree } from './hooks/useTree'

import { Toolbar } from './components/Toolbar'
import { HistoryTree } from './components/HistoryTree'
import { Calculator } from './components/Calculator'

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

export const TreeContext = createContext<{ tree: Tree }>({ tree: new Tree() })

/**
 * The main app
 */
export default function App (): React.ReactNode {
  const tree = useTree()

  return (
    <TreeContext.Provider value={{ tree }}>
      <div className='min-h-screen grid grid-rows-[auto_1fr] grid-cols-1'>
        <Toolbar />

        <PanelGroup autoSaveId='treecalcsplit' direction='horizontal'>
          <Panel id='historytree' minSize={15}>
            <HistoryTree />
          </Panel>
          <ResizeHandle />
          <Panel id='calculator' minSize={40}>
            <Calculator />
          </Panel>
        </PanelGroup>
      </div>
    </TreeContext.Provider>
  )
}
