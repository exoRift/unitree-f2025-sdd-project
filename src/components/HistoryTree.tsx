import { useContext, useEffect } from 'react'
import { TreeContext } from '../App'
import { OneBox } from './HistoryTree/OneBox'

/**
 * The history tree component. Handles the history
 */
export function HistoryTree (): React.ReactNode {
  const { tree } = useContext(TreeContext)

  useEffect(() => {
    if (tree.roots.length === 0) {
      tree.addNewNode('bruh moment')
      tree.addNewNode('lmao')
    }
  })

  return (
    <div className='overflow-auto h-full min-w-full max-w-max'>
      {tree.roots.map((n) => (
        <OneBox data={n} key={n.id} />
      ))}
      {/* <OneBox id="A1" userEquationName="User_Made_Name" equationString="$A0 + 2" note="note"/> */}
    </div>
  )
}
