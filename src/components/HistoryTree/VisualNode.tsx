import { Fragment, useCallback, useEffect } from 'react'
import type { MathfieldElement } from 'mathlive'
import { twMerge } from 'tailwind-merge'
import Xarrow from 'react-xarrows'

import type { TreeNode } from '../../lib/history'
import { useCalculator } from '../../hooks/useCalculator'

import { Button, Card, Dropdown, Input, Modal } from 'react-daisyui'

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

    if (dep.lastModified > mostRecent.lastModified) mostRecent = dep
  }

  return dependency === mostRecent
}

/**
 * A field that displays a node's equation and answer
 * @param props
 * @param props.node      The node
 * @param props.className
 */
export function DynamicMathfield ({ node, className, ...props }: { node: TreeNode } & React.ComponentProps<'math-field'>): React.ReactNode {
  return (
    <math-field {...props} read-only className={twMerge('inline bg-transparent text-neutral-content', className)}>
      {node.rawUserEquation}
      {node.amortizedValue && !node.parsedEquation.isNumberLiteral && (
        <>
          =
          {node.amortizedValue.toLatex()}
        </>
      )}
    </math-field>
  )
}

/**
 * A TreeNode
 * @param props
 * @param props.node The node
 */
export function VisualNode ({ node }: { node: TreeNode }): React.ReactNode {
  const { tree } = useCalculator()
  const { Dialog: AliasDialog, handleShow: handleShowAlias, handleHide: handleHideAlias } = Modal.useDialog()
  const { Dialog: NoteDialog, handleShow: handleShowNote, handleHide: handleHideNote } = Modal.useDialog()

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
        const elem = document.getElementById(`node_${dependency.id}`) as HTMLDivElement
        elem.classList.toggle('ring-2', true)
        elem.classList.toggle('ring-blue-500', true)
      }

      for (const dependency of node.dependents) {
        const elem = document.getElementById(`node_${dependency.id}`) as HTMLDivElement
        elem.classList.toggle('ring-2', true)
        elem.classList.toggle('ring-green-500', true)
      }
    }, { passive: true, signal: aborter.signal })

    root.addEventListener('mouseleave', () => {
      root.classList.toggle('ring-4', false)
      root.classList.toggle('ring-yellow-500', false)
      for (const dependency of node.dependencies) {
        const elem = document.getElementById(`node_${dependency.id}`) as HTMLDivElement
        elem.classList.toggle('ring-2', false)
        elem.classList.toggle('ring-blue-500', false)
      }

      for (const dependency of node.dependents) {
        const elem = document.getElementById(`node_${dependency.id}`) as HTMLDivElement
        elem.classList.toggle('ring-2', false)
        elem.classList.toggle('ring-green-500', false)
      }
    }, { passive: true, signal: aborter.signal })

    return () => aborter.abort()
  }, [node.dependencies.size, node.dependents.size])

  const setAlias = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    if (((e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement).value === 'remove') {
      tree.setAlias(node, undefined)
      return
    }

    const data = new FormData(e.currentTarget)
    const alias = (data.get('alias') as string).toLowerCase()

    tree.setAlias(node, alias)
  }, [tree, node])

  const setNote = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    if (((e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement).value === 'remove') {
      tree.setNote(node, undefined)
      return
    }

    const data = new FormData(e.currentTarget)
    const note = data.get('note') as string

    tree.setNote(node, note)
  }, [tree, node])

  return (
    <div className='flex flex-col items-center gap-24'>
      <Card id={`node_${node.id}`} className='relative bg-neutral text-neutral-content w-48 shrink-0 h-32 p-2'>
        <Card.Title className='flex gap-4 justify-between items-start'>
          <div className='flex flex-col gap-1'>
            <div className='flex gap-2'>
              <dt className='font-bold'>{node.id}</dt>

              <Button variant='link' size='sm' onClick={insertID} className='p-0 h-auto'>Use</Button>
            </div>

            {node.alias && <h3 className='text-sm italic text-neutral-content/70'>{node.alias}</h3>}
          </div>

          <Dropdown>
            <Dropdown.Toggle button={false} role='button' className='symbol cursor-pointer'>more_vert</Dropdown.Toggle>
            <Dropdown.Menu className='bg-base-200 text-base-content w-max'>
              <Dropdown.Item>Edit</Dropdown.Item>
              <Dropdown.Item onClick={handleShowAlias}>{`${node.alias ? 'Edit' : 'Add'} Alias`}</Dropdown.Item>
              <Dropdown.Item onClick={handleShowNote}>{`${node.note ? 'Edit' : 'Add'} Note`}</Dropdown.Item>
              <Dropdown.Item onClick={deleteNode}>Delete</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Card.Title>

        <DynamicMathfield node={node} />

        {node.note && <p className='text-xs text-neutral-content/60 line-clamp-1 overflow-ellipsis mt-auto' title={node.note}>{node.note}</p>}
      </Card>

      <div className='flex gap-12 empty:hidden'>
        {Array.from(node.dependents).map((n) => {
          const isPrimary = isPrimaryDependency(node, n)

          return (
            <Fragment key={n.id}>
              <Xarrow divContainerStyle={{ zIndex: -1 }} start={`node_${node.id}`} end={`node_${n.id}`} headSize={3} color={isPrimary ? 'var(--color-secondary)' : 'var(--color-accent)'} />

              {isPrimary && <VisualNode node={n} />}
            </Fragment>
          )
        })}
      </div>

      <AliasDialog backdrop>
        <form method='dialog' onSubmit={setAlias}>
          <Modal.Header>
            <h1>Add alias</h1>
            <h2 className='strong'>{node.id}</h2>
          </Modal.Header>
          <Modal.Body className='flex flex-col-reverse gap-4'>
            <Input
              onChange={(e) => {
                if (e.currentTarget.value.toLowerCase() === 'ans') e.currentTarget.setCustomValidity('Alias cannot be "ans"')
                else if (e.currentTarget.value.match(/[^A-Za-z]/)) e.currentTarget.setCustomValidity('Alias must only contain letters')
                else e.currentTarget.setCustomValidity('')
              }}
              name='alias'
              autoFocus
              defaultValue={node.alias}
              placeholder='Alias...'
              className='w-full lowercase'
            />

            <Card className='bg-neutral p-4'>
              <DynamicMathfield node={node} />
            </Card>
          </Modal.Body>

          <Modal.Actions className='flex-row-reverse justify-start'>
            <Button type='submit' color='success'>Save</Button>
            <Button type='reset' color='neutral' onClick={handleHideAlias}>Cancel</Button>
            {node.alias && <Button type='submit' value='remove' color='error' className='mr-auto'>Remove</Button>}
          </Modal.Actions>
        </form>
      </AliasDialog>

      <NoteDialog backdrop>
        <form method='dialog' onSubmit={setNote}>
          <Modal.Header>
            <h1>Add Note</h1>
            <h2 className='strong'>{node.id}</h2>
          </Modal.Header>
          <Modal.Body className='flex flex-col-reverse gap-4'>
            <Input name='note' autoFocus defaultValue={node.note} placeholder='Note...' className='w-full' />

            <Card className='bg-neutral p-4'>
              <DynamicMathfield node={node} />
            </Card>
          </Modal.Body>

          <Modal.Actions className='flex-row-reverse justify-start'>
            <Button type='submit' color='success'>Save</Button>
            <Button type='reset' color='neutral' onClick={handleHideNote}>Cancel</Button>
            {node.note && <Button type='submit' value='remove' color='error' className='mr-auto'>Remove</Button>}
          </Modal.Actions>
        </form>
      </NoteDialog>
    </div>
  )
}
