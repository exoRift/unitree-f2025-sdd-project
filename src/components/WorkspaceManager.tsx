import { Button, Modal, Table } from "react-daisyui";

export function WorkspaceManager (): React.ReactNode {
  const { Dialog, handleHide, handleShow } = Modal.useDialog()

  return (
    <>
      <Button color='ghost' onClick={handleShow} className='text-xl'>Workspaces</Button>

      <Dialog backdrop>
        <Modal.Header>Workspaces</Modal.Header>

        <Modal.Body>
          <Table>
            <Table.Head>
              <span>Workspace</span>
              <span>Date Created</span>
              <span />
            </Table.Head>

            <Table.Body></Table.Body>
          </Table>
        </Modal.Body>

        <Modal.Actions>
          <Button color='neutral' onClick={handleHide}>Close</Button>
        </Modal.Actions>
      </Dialog>
    </>
  )
}
