import { OneBox } from './HistoryTree/OneBox'
import { useCalculator } from '../hooks/useCalculator'

/**
 * The history tree component. Handles the history
 */
export function HistoryTree (): React.ReactNode {
  const { tree } = useCalculator()

  return (
    <div className='overflow-auto h-full min-w-full max-w-max'>
      {Array.from(tree.roots).map((n) => (
        <OneBox data={n} key={n.id} />
      ))}
      {/* <OneBox id="A1" userEquationName="User_Made_Name" equationString="$A0 + 2" note="note"/> */}
    </div>
  )
}
