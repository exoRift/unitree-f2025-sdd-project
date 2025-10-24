import { SettingsProvider, useSettings } from './hooks/useSettings'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { useRef } from 'react'

import { Tree } from './lib/history'

import { Toolbar } from './components/Toolbar'
import { HistoryTree } from './components/HistoryTree'
import { Calculator } from './components/Calculator'
import { HistoryCalculator } from './lib/calculator'
import { HistoryContext } from './hooks/useCalculator'

/**
 * A stylized resize handle
 */
function ResizeHandle (): React.ReactNode {
  return (
    <PanelResizeHandle className='relative flex w-px hover:outline outline-1 outline-border items-center justify-center secondBg after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90'>
      <div className='z-10 flex h-4 w-3 items-center justify-center rounded-sm border secondBg'>
        <div className='symbol text-xl'>drag_indicator</div>
      </div>
    </PanelResizeHandle>
  )
}

/**
 * Contains application components
 * @returns Unitree layout equipped with the Toolbar, History-Tree, resizable panel divider, and
 * Calculator
 */
function AppContext (): React.ReactNode {
  const { horizontalOn, setHorizontalOn } = useSettings()

  return (
    <div className='min-h-screen grid grid-rows-[auto_1fr] grid-cols-1'>
      <Toolbar horizontalOn={horizontalOn} setHorizontalOn={setHorizontalOn} />

      <PanelGroup autoSaveId='treecalcsplit' direction={horizontalOn ? 'vertical' : 'horizontal'}>
        <Panel id='historytree' minSize={15}>
          <HistoryTree />
        </Panel>
        <ResizeHandle />
        <Panel id='calculator' minSize={40}>
          <div className='flex-1 h-full overflow-auto'>
            <Calculator />
          </div>
        </Panel>
      </PanelGroup>
    </div>
  )
}

/**
 * The main app
 */
export default function App (): React.ReactNode {
  const ctx = useRef((() => {
    const tree = new Tree()
    const calculator = new HistoryCalculator(tree)
    return { tree, calculator }
  })())

  return (
    <HistoryContext.Provider value={ctx.current}>
      <SettingsProvider>
        <AppContext />
      </SettingsProvider>
    </HistoryContext.Provider>
  )
}
