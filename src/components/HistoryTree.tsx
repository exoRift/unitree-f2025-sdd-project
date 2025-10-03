/*
Remove-Item -Recurse -Force node_modules, bun.lockb, bun.lock, package-lock.json
bun pm cache rm
bun i
bun run --bun dev
*/

import { useEffect, useRef, useState } from "react"
// import { TreeNode, Tree } from "../lib/history"
import { useTreeContext } from "../App";

import { OneBox } from './HistoryTree/OneBox'

/**
 * The history tree component. Handles the history
 */
export function HistoryTree (): React.ReactNode {
  const { tree } = useTreeContext();

  useEffect(() => {
    if (tree.roots.length === 0) {
      tree.addNewNode('bruh moment')
      tree.addNewNode('lmao')
    }
  }, [])

  return (
    <div className='overflow-auto h-full min-w-full max-w-max'>
      {tree.roots.map((n) => (
        <OneBox data={n} key={n.id} />
      ))}
      {/* <OneBox id="A1" userEquationName="User_Made_Name" equationString="$A0 + 2" note="note"/> */}
    </div>
  )
}
