import { useCallback, useEffect, useState } from 'react'

import { useCalculator } from '../hooks/useCalculator'
import { useSettings } from '../hooks/useSettings'
import { usePostrenderTask } from '../hooks/usePostrenderTask'

import { Button, Card, Input, Modal } from 'react-daisyui'
import { DynamicMathfield, VisualNode } from './HistoryTree/VisualNode'
import type { TreeNode } from '../lib/history'

/**
 * The history tree component. Handles the history
 */
export function HistoryTree (): React.ReactNode {
  const { tree, session } = useCalculator()
  const { settings } = useSettings()
  const queue = usePostrenderTask()
  const { Dialog, handleShow, handleHide } = Modal.useDialog()

  const { Dialog: AliasDialog, handleShow: handleShowAlias, handleHide: handleHideAlias } = Modal.useDialog()
  const [aliasingNode, setAliasingNode] = useState<TreeNode | null>(null)
  const { Dialog: NoteDialog, handleShow: handleShowNote, handleHide: handleHideNote } = Modal.useDialog()
  const [notingNode, setNotingNode] = useState<TreeNode | null>(null)

  const clear = useCallback(() => {
    handleHide()
    session.clear()
  }, [handleHide, session])

  const setAlias = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    if (!aliasingNode) return
    if (((e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement).value === 'remove') {
      tree.setAlias(aliasingNode, undefined)

      return
    }

    const data = new FormData(e.currentTarget)
    const alias = (data.get('alias') as string).toLowerCase()

    try {
      tree.setAlias(aliasingNode, alias)
    } catch (err) {
      if (err instanceof Error) alert(err.message)
      e.preventDefault()
    }
  }, [tree, aliasingNode])

  const setNote = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    if (!notingNode) return
    if (((e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement).value === 'remove') {
      tree.setNote(notingNode, undefined)

      return
    }

    const data = new FormData(e.currentTarget)
    const note = data.get('note') as string

    tree.setNote(notingNode, note)
  }, [tree, notingNode])

  useEffect(() => {
    if (settings.autoSnapToNew) {
      const aborter = new AbortController()

      tree.addEventListener('mutate', () => {
        queue(() => {
          if (tree.lastCreatedNode) document.getElementById(`node_${tree.lastCreatedNode.id}`)?.scrollIntoView()
        })
      }, { signal: aborter.signal, passive: true })

      return () => aborter.abort()
    }
  }, [queue, tree, settings.autoSnapToNew])

  return (
    <div className='relative h-full flex flex-col'>
      <div className='relative h-0 grow overflow-auto flex gap-12 p-8'>
        {Array.from(tree.roots).map((node) => (
          <VisualNode
            key={node.id}
            node={node}
            onAlias={(n) => {
              if (n === aliasingNode) handleShowAlias()
              else {
                queue(handleShowAlias)
                setAliasingNode(n)
              }
            }}
            onNote={(n) => {
              if (n === notingNode) handleShowNote()
              else {
                queue(handleShowNote)
                setNotingNode(n)
              }
            }}
          />
        ))}
      </div>

      <Button variant='link' className='absolute bottom-0 right-0' onClick={handleShow}>Clear History</Button>

      <AliasDialog backdrop>
        <form method='dialog' onSubmit={setAlias}>
          <Modal.Header>
            <h1 className='font-bold'>Add alias</h1>
            <h2 className='italic'>{`Node ${aliasingNode?.id ?? ''}`}</h2>
          </Modal.Header>

          <Modal.Body className='flex flex-col-reverse gap-4'>
            {aliasingNode && (
              <Input
                onChange={(e) => {
                  if (e.currentTarget.value.toLowerCase() === 'ans') e.currentTarget.setCustomValidity('Alias cannot be "ans"')
                  else if (e.currentTarget.value.match(/[^A-Za-z]/)) e.currentTarget.setCustomValidity('Alias must only contain letters')
                  else e.currentTarget.setCustomValidity('')
                }}
                name='alias'
                autoFocus
                defaultValue={aliasingNode.alias}
                placeholder='Alias...'
                className='w-full lowercase'
              />
            )}

            <Card className='bg-neutral p-4'>
              {aliasingNode && <DynamicMathfield node={aliasingNode} />}
            </Card>
          </Modal.Body>

          <Modal.Actions className='flex-row-reverse justify-start'>
            <Button type='submit' color='success'>Save</Button>
            <Button type='reset' color='neutral' onClick={handleHideAlias}>Cancel</Button>
            {aliasingNode?.alias && <Button type='submit' value='remove' color='error' className='mr-auto'>Remove</Button>}
          </Modal.Actions>
        </form>
      </AliasDialog>

      <NoteDialog backdrop>
        <form method='dialog' onSubmit={setNote}>
          <Modal.Header>
            <h1 className='font-bold'>Add alias</h1>
            <h2 className='italic'>{`Node ${notingNode?.id ?? ''}`}</h2>
          </Modal.Header>

          <Modal.Body className='flex flex-col-reverse gap-4'>
            {notingNode && <Input name='note' autoFocus defaultValue={notingNode.note} placeholder='Note...' className='w-full' />}

            <Card className='bg-neutral p-4'>
              {notingNode && <DynamicMathfield node={notingNode} />}
            </Card>
          </Modal.Body>

          <Modal.Actions className='flex-row-reverse justify-start'>
            <Button type='submit' color='success'>Save</Button>
            <Button type='reset' color='neutral' onClick={handleHideNote}>Cancel</Button>
            {notingNode?.note && <Button type='submit' value='remove' color='error' className='mr-auto'>Remove</Button>}
          </Modal.Actions>
        </form>
      </NoteDialog>

      <Dialog>
        <Modal.Header>
          <h1 className='font-bold'>Clear History</h1>
        </Modal.Header>

        <Modal.Body>
          <Modal.Body>
            <p className='text-lg font-semibold'>Are you sure you want to clear your history? This cannot be undone.</p>
          </Modal.Body>
        </Modal.Body>

        <Modal.Actions>
          <Button color='neutral' onClick={handleHide}>No</Button>
          <Button color='error' onClick={clear}>Yes</Button>
        </Modal.Actions>
      </Dialog>
    </div>
  )
}
