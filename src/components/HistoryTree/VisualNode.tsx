import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import type { MathfieldElement } from 'mathlive'
import { twMerge } from 'tailwind-merge'

import type { TreeNode } from '../../lib/history'
import { useCalculator } from '../../hooks/useCalculator'

import Xarrow from 'react-xarrows'
import { Button, Card, Dropdown } from 'react-daisyui'

/**
 * Determine if a dependency is the primary dependency of a dependent
 * @param dependency The dependency
 * @param dependent  The dependent
 * @returns          true if primary
 */
function isPrimaryDependency (dependency: TreeNode, dependent: TreeNode): boolean {
  let mostRecent: TreeNode | undefined

  for (const dep of dependent.dependencies) {
    if (!mostRecent) {
      mostRecent = dep
      continue
    }

    if (dep.createdAt > mostRecent.createdAt) mostRecent = dep
  }

  return dependency === mostRecent
}

/**
 * A field that displays a node's equation and answer
 * @param props
 * @param props.node        The node
 * @param props.showNumeric Show the numeric version of the value
 * @param props.className
 * @param props.'read-only'
 */
export function DynamicMathfield ({ node, showNumeric, className, 'read-only': rdonly = true, ...props }: { node: TreeNode, showNumeric?: boolean } & React.ComponentProps<'math-field'>): React.ReactNode {
  return (
    <math-field title={rdonly ? node.amortizedValue?.N().toString() : undefined} read-only={rdonly} className={twMerge('inline bg-transparent text-neutral-content', className)} {...props}>
      {node.rawUserEquation}
      {rdonly && node.amortizedValue && !node.parsedEquation.isNumberLiteral && (
        <>
          =
          {(showNumeric ? node.amortizedValue.N() : node.amortizedValue).toLatex()}
        </>
      )}
    </math-field>
  )
}

/**
 * Sum all nodes within a subtree
 * @param node The node
 * @returns    The number of nodes in the subtree
 */
function sumSubtree (node: TreeNode): number {
  let sum = 1

  for (const dependent of node.dependents) {
    if (isPrimaryDependency(node, dependent)) sum += sumSubtree(dependent)
  }

  return sum
}

/**
 * A TreeNode
 * @param props
 * @param props.node     The node
 * @param props.onAlias  A callback for when the "add alias" option is clicked
 * @param props.onNote   A callback for when the "add note" option is clicked
 * @param props.rightEnd Is this node on the right end of the screen? (context menu needs to be shifted)
 */
export function VisualNode ({ node, onAlias, onNote, rightEnd }: { node: TreeNode, onAlias: (node: TreeNode) => void, onNote: (node: TreeNode) => void, rightEnd?: boolean }): React.ReactNode {
  const fieldRef = useRef<MathfieldElement>(null)
  const { tree, calculator } = useCalculator()

  const [editing, setEditing] = useState(false)

  const insertID = useCallback(() => {
    const field = document.getElementById('eqInput') as MathfieldElement
    field.insert(`\\$${node.alias ?? node.id}`)
    field.focus()
  }, [node])

  const deleteNode = useCallback(() => {
    tree.deleteNode(node)
  }, [tree, node])

  useEffect(() => {
    const aborter = new AbortController()

    const root = document.getElementById(`node_${node.id}`) as HTMLDivElement
    root.addEventListener('mouseenter', () => {
      root.classList.toggle('ring-4', true)
      root.classList.toggle('ring-yellow-500', true)
      for (const dependency of node.dependencies) {
        const elem = document.getElementById(`node_${dependency.id}`) as HTMLDivElement | null
        elem?.classList.toggle('ring-2', true)
        elem?.classList.toggle('ring-blue-500', true)
      }

      for (const dependency of node.dependents) {
        const elem = document.getElementById(`node_${dependency.id}`) as HTMLDivElement | null
        elem?.classList.toggle('ring-2', true)
        elem?.classList.toggle('ring-green-500', true)
      }
    }, { passive: true, signal: aborter.signal })

    function cleanup (): void {
      root.classList.toggle('ring-4', false)
      root.classList.toggle('ring-yellow-500', false)
      for (const dependency of node.dependencies) {
        const elem = document.getElementById(`node_${dependency.id}`) as HTMLDivElement | null
        elem?.classList.toggle('ring-2', false)
        elem?.classList.toggle('ring-blue-500', false)
      }

      for (const dependency of node.dependents) {
        const elem = document.getElementById(`node_${dependency.id}`) as HTMLDivElement | null
        elem?.classList.toggle('ring-2', false)
        elem?.classList.toggle('ring-green-500', false)
      }
    }

    root.addEventListener('mouseleave', cleanup, { passive: true, signal: aborter.signal })

    return () => {
      aborter.abort()
      cleanup()
    }
  }, [node.id, node.dependencies.size, node.dependents.size])

  const startEditing = useCallback(() => {
    setEditing(true)
    fieldRef.current?.select()
  }, [])

  const saveEdit = useCallback(() => {
    setEditing(false)
    calculator.editNode(node, fieldRef.current!.value)
  }, [calculator, node])

  return (
    <div data-collapsed={node.collapsed || null} className={twMerge('transition flex flex-col items-center gap-24 ring-1 ring-transparent rounded-2xl', !node.collapsed && '[&:has(>[data-node]_[data-collapser]:hover)]:ring-black')}>
      <Card data-node id={`node_${node.id}`} className={twMerge('transition-[filter] relative bg-neutral text-neutral-content w-48 shrink-0 h-32 p-2', node.collapsed && 'brightness-75')} onDoubleClick={(e) => { e.preventDefault(); startEditing() }}>
        {node.collapsed
          ? (
            <Fragment key='content'>
              <h1 className='text-xl font-bold'>
                <span>{node.id}</span>
                <span className='text-sm'>&nbsp;- Collapsed</span>
              </h1>
              {node.alias && <h3 className='text-sm italic text-neutral-content/70'>{node.alias}</h3>}

              <h2 className='italic text-base mt-4'>{sumSubtree(node)} descendants</h2>
            </Fragment>
          )
          : (
            <Fragment key='content'>
              <Card.Title className='flex gap-4 justify-between items-start'>
                <div className='flex flex-col gap-1'>
                  <div className='flex gap-2'>
                    <dt className='font-bold'>{node.id}</dt>

                    <Button variant='link' size='sm' onClick={insertID} className='p-0 h-auto' onDoubleClick={(e) => e.stopPropagation()}>Use</Button>
                  </div>

                  {node.alias && <h3 className='text-sm italic text-neutral-content/70'>{node.alias}</h3>}
                </div>

                <Dropdown horizontal={rightEnd ? 'left' : undefined} vertical='bottom'>
                  <Dropdown.Toggle button={false} role='button' className='symbol cursor-pointer'>more_vert</Dropdown.Toggle>
                  <Dropdown.Menu className='bg-base-200 text-base-content w-max'>
                    <Dropdown.Item onClick={startEditing}>Edit</Dropdown.Item>
                    <Dropdown.Item onClick={() => onAlias(node)}>{`${node.alias ? 'Edit' : 'Add'} Alias`}</Dropdown.Item>
                    <Dropdown.Item onClick={() => onNote(node)}>{`${node.note ? 'Edit' : 'Add'} Note`}</Dropdown.Item>
                    <Dropdown.Item onClick={deleteNode}>Delete</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Card.Title>

              <DynamicMathfield
                onKeyDown={editing ? (e) => e.key === 'Enter' && !e.defaultPrevented && saveEdit() : undefined}
                ref={fieldRef}
                node={node}
                read-only={!editing}
                className={twMerge(editing && 'bg-base-200 text-base-content')}
              />

              {editing
                ? (
                  <div className='flex justify-end gap-2 mt-auto'>
                    <Button color='error' size='xs' onClick={() => setEditing(false)}>Discard</Button>
                    <Button color='success' size='xs' onClick={saveEdit}>Save</Button>
                  </div>
                )
                : node.note
                  ? <p className='text-xs text-neutral-content/60 line-clamp-1 overflow-ellipsis mt-auto' title={node.note}>{node.note}</p>
                  : null}
            </Fragment>
          )}

        <button data-collapser className='symbol bg-neutral size-6 absolute right-1 bottom-1 cursor-pointer [:has(>&):not(:has(+*_[data-node]))>&]:hidden' title='Collapse' onClick={() => tree.toggleNodeCollapse(node)} onDoubleClick={(e) => e.stopPropagation()}>
          {node.collapsed ? 'expand_content' : 'collapse_content'}
        </button>
      </Card>

      <div className='flex gap-12 empty:hidden [[data-collapsed]_&]:absolute [[data-collapsed]_&_[data-node]]:absolute [[data-collapsed]_&]:pointer-events-none [[data-collapsed]_&_[data-node]]:opacity-0'>
        {Array.from(node.dependents).map((n) => {
          const isPrimary = isPrimaryDependency(node, n)

          return (
            <Fragment key={n.id}>
              {/* TODO: hide secondaries within the collapsed tree */}
              <Xarrow divContainerProps={{ className: isPrimary ? '[[data-collapsed]_&]:hidden' : undefined }} divContainerStyle={{ zIndex: -1 }} start={`node_${node.id}`} end={`node_${n.id}`} path='straight' headSize={3} color={isPrimary ? 'var(--color-secondary)' : 'var(--color-accent)'} />

              {isPrimary && <VisualNode node={n} onAlias={onAlias} onNote={onNote} />}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}
