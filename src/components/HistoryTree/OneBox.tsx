import { useEffect, useState } from 'react'

import type { TreeNode } from '../../lib/history'
import { useCalculator } from '../../hooks/useCalculator'

/**
 * This will take in a user inputted equation and make it look better. So fractions actually look
 * like fractions. Right now it just prints a placeholder text that can't change in any way.
 * @param props         Contains all information you need
 * @param props.initial The equation the user typed in and will be formatted in this function
 * @returns             A <p> tag with the equation of the formatted user equation
 */
function UserMadeEquationParser ({ initial }: { initial: string }) : React.ReactNode {
  return (
    <p className='text-center opacity-80 mb-2'>
      {initial}
      {/* placeholder (equation data type not decided yet) */}
      {/* {typeof initial === 'undefined' && (<p>Parameter Swap</p>)} */}
    </p>
  )
}

/**
 * This function creates a box on the graph side of the equation that represents
 * one equation the user typed in.
 * @param props      Contains all information you need
 * @param props.data The TreeNode that we want to display
 */
export function OneBox ({ data } : { data: TreeNode }) : React.ReactNode {
  const curNode : TreeNode = data
  const { tree } = useCalculator()

  const displayId : string = data.id
  const displayAlias : string = data.alias === undefined ? 'Equation_' + data.id : data.alias
  const displayEquation = data.parsedEquation.toString()
  const displayNote : string = data.note === undefined ? '' : data.note

  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleClick = (_event: MouseEvent) : void => {
      if (open) setOpen(false)
    }
    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('click', handleClick)
    }
  }, [open])

  const handleLeave = (_ : any): void => {
    if (open) setOpen(false)
  }
  const deleteNode = (_ : any): void => {
    tree.deleteNode(curNode)
  }

  const handleClick = (e : React.MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation() // e.preventDefault(); makes this run before useEffect
    const container = e.currentTarget.getBoundingClientRect()
    setMenuPos({ x: container.right - e.clientX, y: e.clientY - container.top })
    setOpen(!open)
  }

  return (
    <div onMouseLeave={handleLeave} className='relative p-3 rounded-2xl bg-neutral-800 text-neutral-content shadow-xl ring-1 ring-white/5 w-max min-w-[200px]'>
      {/* Top-right hamburger */}
      <div className='absolute top-3 right-3 cursor-pointer' onClick={handleClick}>
        <div className='w-3 h-0.5 bg-white my-0.5' />
        <div className='w-3 h-0.5 bg-white my-0.5' />
        <div className='w-3 h-0.5 bg-white my-0.5' />
      </div>

      {/* Content */}
      <h3 className='text-lg font-bold'>{displayId}</h3>
      <p className='text-lg mb-2 font-semibold'>{displayAlias}</p>
      <UserMadeEquationParser initial={displayEquation} />
      {displayNote !== '' && (
        <div className='bg-neutral-700 rounded-2xl p-2 shadow-lg'>
          <p>{displayNote}</p>
        </div>
      )}

      {/* Floating menu */}
      {open && (
        <div
          className='absolute bg-neutral-700 text-white rounded shadow-lg py-2 w-max'
          style={{ top: menuPos.y, right: menuPos.x, transform: 'translateX(90%) translateY(15px)' }}
        >
          <button className='block px-4 py-2 hover:bg-neutral-600 w-full text-left'>Edit</button>
          <button className='block px-4 py-2 hover:bg-neutral-600 w-full text-left' onClick={deleteNode}>Delete</button>
        </div>
      )}
    </div>
  )
}
