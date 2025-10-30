import { Button, Modal } from 'react-daisyui'
import { useCalculator } from '../hooks/useCalculator'

import { VisualNode } from './HistoryTree/VisualNode'
import { useCallback } from 'react'

/**
 * The history tree component. Handles the history
 */
export function HistoryTree (): React.ReactNode {
  const { tree, session } = useCalculator()
  const { Dialog, handleShow, handleHide } = Modal.useDialog()

  const clear = useCallback(() => {
    handleHide()
    session.clear()
  }, [handleHide, session])

  return (
    <div className='relative h-full flex flex-col'>
      <div className='relative h-0 grow overflow-auto flex gap-12 p-8'>
        {Array.from(tree.roots).map((n) => (
          <VisualNode key={n.id} node={n} />
        ))}
      </div>

      <Button variant='link' className='absolute bottom-0 right-0' onClick={handleShow}>Clear History</Button>

      <Dialog>
        <Modal.Body>
          <Modal.Header>Clear History</Modal.Header>
          <Modal.Body>
            <p className='text-lg font-semibold'>Are you sure you want to clear your history? This cannot be undone.</p>
          </Modal.Body>

          <Modal.Actions>
            <Button color='neutral' onClick={handleHide}>No</Button>
            <Button color='error' onClick={clear}>Yes</Button>
          </Modal.Actions>
        </Modal.Body>
      </Dialog>
    </div>
  )
}
