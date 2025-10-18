import { OneBox } from './HistoryTree/OneBox'
import { useCalculator } from '../hooks/useCalculator'

/**
 * The history tree component. Handles the history
 */
export function HistoryTree (): React.ReactNode {
  const { tree } = useCalculator()

  return (
    <div className='relative flex flex-row flex-nowrap overflow-auto h-full pl-4 pr-4 min-w-max'>
      {[...Array(tree.getTotalNumberTrees())].map((_, i) => (
        <div key={i} className='grid grid-cols-1 rounded-box w-max h-max'>
          {[...Array(tree.getNumberOfRowsInTree(i))].map((_z, j) => (
            <div key={j} className='flex flex-row pt-8'>
              {tree.getAllNodesInTreeAndRow(i, j).map((_y, k) => (
                <OneBox key={k} data={tree.getAllNodesInTreeAndRow(i, j)[k]} />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
