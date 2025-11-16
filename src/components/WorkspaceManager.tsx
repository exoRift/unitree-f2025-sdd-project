import { useCallback, useState } from 'react'

import { useCalculator } from '../hooks/useCalculator'

import { Button, Input, Join, Modal, Table } from 'react-daisyui'

/**
 * A save button that allows for input of a name
 * @param props
 * @param props.onSave A callback for when the save button is triggered
 */
function SaveButton ({ onSave }: { onSave: (n: string) => void }): React.ReactNode {
  const { workspaces } = useCalculator(true)

  const [inputting, setInputting] = useState(false)
  const [conflict, setConflict] = useState(false)

  const onSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    const data = new FormData(e.currentTarget)

    setInputting(false)
    setConflict(false)
    e.currentTarget.reset()
    onSave(data.get('name') as string)
  }, [onSave])

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.currentTarget.value

    setConflict(workspaces.workspaces.has(name))
  }, [workspaces])

  return (
    <form method='dialog' className='mt-4 w-full' onSubmit={onSubmit}>
      {inputting
        ? (
          <Join horizontal className='relative w-full'>
            <Input color={conflict ? 'warning' : 'neutral'} name='name' className='grow join-item' placeholder='Workspace name...' autoFocus onChange={onChange} />
            {conflict && <label className='absolute left-0 -bottom-6 text-sm text-warning'>A workspace already exists with this name; it will be overwritten</label>}

            <Button type='submit' className='aspect-square join-item' color='primary'>
              <div className='symbol'>check</div>
            </Button>
          </Join>
        )
        : (
          <Button type='button' className='w-full' color='primary' onClick={() => setInputting(true)}>
            <div className='symbol'>archive</div>
            Save Current Workspace
          </Button>
        )}
    </form>
  )
}

/**
 * The workspace manager for saving and loading workspaces
 */
export function WorkspaceManager (): React.ReactNode {
  const { workspaces } = useCalculator(true)
  const { Dialog, handleHide, handleShow } = Modal.useDialog()

  const [, setSignal] = useState(0)

  return (
    <>
      <Button color='ghost' onClick={handleShow} className='text-xl'>Workspaces</Button>

      <Dialog backdrop className='max-w-3xl'>
        <Modal.Header>
          <h1 className='font-bold'>Workspaces</h1>
        </Modal.Header>

        <Modal.Body>
          {workspaces.workspaces.size
            ? (
              <div className='max-h-96 overflow-auto'>
                <Table>
                  <Table.Head className='sticky top-0 bg-base-100'>
                    <span>Workspace</span>
                    <span>Size</span>
                    <span>Date Created</span>
                    <span />
                  </Table.Head>

                  <Table.Body>
                    {Array.from(workspaces.workspaces.values()).reverse().map((w) => (
                      <Table.Row key={w.name}>
                        <span>{w.name}</span>
                        <span>{`${w.data.tree.nodes.length} node${w.data.tree.nodes.length === 1 ? '' : 's'}`}</span>
                        <span>{Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(w.createdAt)}</span>
                        <div className='flex gap-2 justify-end'>
                          {/* TODO: on error, display */}
                          <form method='dialog'>
                            <Button color='secondary' size='sm' onClick={() => workspaces.recall(w)}>
                              <div className='symbol'>approval_delegation</div>
                              Load
                            </Button>
                          </form>
                          <Button color='error' size='sm' onClick={() => { workspaces.deleteWorkspace(w.name); setSignal((prior) => prior + 1) }}>
                            <div className='symbol'>delete_forever</div>
                            Delete
                          </Button>
                        </div>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </div>
            )
            : (
              <h3 className='text-base-content/60 text-xl text-center'>No saved workspaces found.</h3>
            )}

          <SaveButton onSave={(name) => { workspaces.saveWorkspace(name, true); setSignal((prior) => prior + 1) }} />
        </Modal.Body>

        <Modal.Actions>
          <Button color='neutral' onClick={handleHide}>Close</Button>
        </Modal.Actions>
      </Dialog>
    </>
  )
}
