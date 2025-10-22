import { useEffect } from 'react'

import { useCalculator } from '../hooks/useCalculator'

import { VisualNode } from './HistoryTree/VisualNode'

/**
 * The history tree component. Handles the history
 */
export function HistoryTree (): React.ReactNode {
  const { tree, calculator } = useCalculator()

  return (
    <div className='h-full flex flex-col'>
      <div className='relative h-0 grow overflow-auto flex gap-12 p-8'>
        {Array.from(tree.roots).map((n) => (
          <VisualNode key={n.id} node={n} />
        ))}
      </div>
    </div>
  )
}
