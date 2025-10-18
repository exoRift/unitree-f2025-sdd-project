import { useEffect, useState } from 'react'

import type { TreeNode } from '../../lib/history'
import { useCalculator } from '../../hooks/useCalculator'

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
  const [displayAlias, setDisplayAlias] = useState(data.alias !== undefined ? data.alias : 'Equation_' + data.id)
  const displayEquation = data.parsedEquation.toString()
  const [displayNote, setDisplayNote] = useState(data.note === undefined ? '' : data.note)

  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })
  const [open, setOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [collapse, setCollapse] = useState(false)

  useEffect(() => {
    const handleClick = (_event: MouseEvent) : void => {
      if (open) setOpen(false)
    }
    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('click', handleClick)
    }
  }, [open])

  const handleMouseLeave = (_ : any) : void => { setOpen(false) }
  const deleteNode = (_ : any): void => { tree.deleteNode(curNode) }
  const changeEditMode = (_ : any): void => { setEditMode(!editMode); setCollapse(false) }
  const changeCollapse = (_ : any): void => { setCollapse(!collapse); setEditMode(false) }

  const changeAlias = (e : React.ChangeEvent<HTMLInputElement>): void => {
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // Requires a need to call functions within the tree for alias update
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // And default Alias won't match tree
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    setDisplayAlias(e.target.value)
    curNode.setAlias(e.target.value)
  }
  const changeNote = (e : React.ChangeEvent<HTMLTextAreaElement>): void => {
    setDisplayNote(e.target.value)
    curNode.setAlias(e.target.value)
  }

  const handleHamburgerMenuAppear = (e : React.MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation() // e.preventDefault(); makes this run before useEffect

    // get container of entire GUI tree
    let parentElem = e.currentTarget.parentElement
    for (let i = 0; i < 3; i++) {
      if (parentElem === null) throw Error('Somehow a GUI box has no parent')
      parentElem = parentElem.parentElement
    }
    if (parentElem === null) throw Error('Somehow a GUI box has no parent')
    const parentRect = parentElem.getBoundingClientRect()

    // set vars
    setMenuPos({ x: e.clientX, y: e.clientY - parentRect.top })
    setOpen(!open)
  }

  return (
    <div className='w-max h-max m-auto pr-2 pl-2' onMouseLeave={handleMouseLeave}>
      {/* Floating menu */}
      {open && (
        <div
          className='absolute bg-neutral-700 text-white rounded shadow-lg py-2 w-max z-10'
          style={{ top: menuPos.y, left: menuPos.x, transform: 'translateX(2%) translateY(0)' }}
        >
          <button className='block px-4 py-2 hover:bg-neutral-600 w-full text-left' onClick={changeCollapse}>{collapse ? 'Expand' : 'Collapse'}</button>
          <button className='block px-4 py-2 hover:bg-neutral-600 w-full text-left' onClick={changeEditMode}>{editMode ? 'Stop Editing' : 'Edit'}</button>
          <button className='block px-4 py-2 hover:bg-neutral-600 w-full text-left' onClick={deleteNode}>Delete</button>
        </div>
      )}
      <div
        className='relative p-3 rounded-2xl bg-neutral-800 text-neutral-content shadow-xl ring-1 ring-white/5 w-max min-w-[200px] max-w-[400px] h-max min-h-[50px] max-h-[200px] overflow-y-auto'
      >
        {/* Top-right hamburger */}
        <div className='absolute top-3 right-3 cursor-pointer' onClick={handleHamburgerMenuAppear}>
          <div className='w-3 h-0.5 bg-white my-0.5' />
          <div className='w-3 h-0.5 bg-white my-0.5' />
          <div className='w-3 h-0.5 bg-white my-0.5' />
        </div>

        {/* Content */}
        <h3 className='text-lg font-bold'>{displayId}</h3>
        {!editMode && (<p className='text-lg mb-2 font-semibold'>{displayAlias}</p>)}
        {editMode && (
          <p className='flex items-center gap-2'>
            Name:
            <input
              placeholder={'Equation_' + displayId}
              defaultValue={displayAlias}
              onChange={changeAlias}
              className='input bg-neutral-800 text-white placeholder-neutral-400 border border-neutral-600 focus:outline-none focus:border-primary w-64 px-1 rounded-md'
            />
          </p>
        )}
        {!collapse && (<math-field>{displayEquation}</math-field>)}
        {!collapse && !editMode && displayNote !== '' && (
          <div className='bg-neutral-700 rounded-2xl p-2 shadow-lg'>
            <pre>{displayNote}</pre>
          </div>
        )}
        {editMode && (
          <div className='bg-neutral-700 rounded-2xl p-2 shadow-lg'>
            <p className='flex items-center gap-2'>
              Note:
              <textarea
                placeholder=''
                defaultValue={displayNote}
                onChange={changeNote}
                className='input bg-neutral-800 text-white placeholder-neutral-400 border border-neutral-600 focus:outline-none focus:border-primary w-64 px-1 rounded-md'
              />
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
