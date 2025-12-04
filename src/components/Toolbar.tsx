/**
 * The top toolbar component. User customization, workspacing, and other settings are managed here
 */
import { useCallback, useState } from 'react'

import { useSettings, type SettingsSchema } from '../hooks/useSettings'
import { useCalculator } from '../hooks/useCalculator'

import { Button, Modal, Navbar, Select, Toggle } from 'react-daisyui'
import { WorkspaceManager } from './WorkspaceManager'

import logo from '../images/unitree_logo_noWords.png'

/**
 * A button that opens up the settings menu
 */
function SettingsButton (): React.ReactNode {
  const { session } = useCalculator()
  const { settings, setters } = useSettings()
  const [open, setOpen] = useState(false)

  const setSaveSession = useCallback((v: boolean) => {
    if (v) session.save()
    else session.purge()

    setters.saveSession(v)
  }, [session, setters])

  return (
    <div>
      <button className='group inline-flex justify-center items-center cursor-pointer overflow-clip size-12' onClick={() => setOpen(true)}>
        <div className='transition duration-500 symbol text-3xl group-hover:rotate-90'>settings</div>
      </button>

      <Modal.Legacy open={open} onClickBackdrop={() => setOpen(false)}>
        <Modal.Header>
          <h1 className='font-bold'>Settings</h1>
        </Modal.Header>

        <Modal.Body>
          <div className='space-y-4'>
            <div className='space-y-1'>
              <label htmlFor='orientation' className='font-bold text-lg'>Split Orientation</label>

              <div className='flex gap-2'>
                <label htmlFor='orientation'>Horizontal</label>
                <Toggle color='primary' id='orientation' checked={settings.orientation === 'vertical'} onChange={() => setters.orientation(settings.orientation === 'horizontal' ? 'vertical' : 'horizontal')} />
                <label htmlFor='orientation'>Vertical</label>
              </div>
            </div>

            <div className='space-y-1'>
              <label htmlFor='snap' className='font-bold text-lg'>Auto Snap to New Nodes</label>

              <Toggle className='grid' color='primary' id='snap' checked={settings.autoSnapToNew} onChange={() => setters.autoSnapToNew(!settings.autoSnapToNew)} />
            </div>

            <div className='space-y-1'>
              <label htmlFor='snap' className='font-bold text-lg'>Save Data Between Sessions</label>

              <Toggle className='grid' color='primary' id='snap' checked={settings.saveSession} onChange={() => setSaveSession(!settings.saveSession)} />
            </div>
          </div>

          <Modal.Actions>
            <Button color='neutral' onClick={() => setOpen(false)}>Close</Button>
          </Modal.Actions>
        </Modal.Body>
      </Modal.Legacy>
    </div>
  )
}

/**
 * A button that opens up the guide menu
 */
function GuideButton (): React.ReactNode {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type='button'
        onClick={() => setOpen(true)}
        aria-label='Open guide'
        title='Guide'
        className='group inline-flex justify-center items-center cursor-pointer overflow-clip size-12 rounded-full hover:bg-base-200 transition'
      >
        <div className='symbol text-3xl transition-transform duration-300 group-hover:scale-125'>
          book_2
        </div>
      </button>

      <Modal.Legacy open={open} onClickBackdrop={() => setOpen(false)}>
        <Modal.Header>
          <h1 className='font-bold text-lg'>How to use the Unitree Calculator</h1>
        </Modal.Header>

        <Modal.Body className='space-y-3 max-h-[70vh] overflow-y-auto'>
          <p>
            This calculator builds a <strong>history tree</strong> of your computations.
            Every time you press <strong>Evaluate</strong>, you create a new <strong>node</strong>.
          </p>

          <div>
            <h2 className='font-semibold text-sm'>1. Creating nodes</h2>
            <ul className='list-disc list-inside pl-4 text-sm space-y-1'>
              <li>Enter an expression into the math field.</li>
              <li>Press <strong>Evaluate</strong> or hit <strong>Enter</strong>.</li>
              <li>A new node appears in the history panel.</li>
            </ul>
          </div>

          <div>
            <h2 className='font-semibold text-sm'>2. Referencing previous nodes</h2>
            <p className='text-sm'>
              New expressions can reference earlier nodes, creating <strong>child nodes</strong>.
              These depend on the value of the parent node. Nodes can be referenced
              with the <strong>Use</strong> button or
              using the <strong>$</strong> operator before the name.
              <br /><br />
              Example: <code>$a0</code>.
              <br /><br />
              A node will be shown as a descendant of the dependency that was most recently created.
            </p>
          </div>

          <div>
            <h2 className='font-semibold text-sm'>3. Automatic updates</h2>
            <p className='text-sm'>
              When you edit the equation contained within a node, all of its children (and
              their children) update automatically. Updates cascade through the
              tree.
            </p>
          </div>
        </Modal.Body>

        <Modal.Actions>
          <Button color='primary' onClick={() => setOpen(false)}>
            Got it
          </Button>
        </Modal.Actions>
      </Modal.Legacy>
    </>
  )
}

/**
 * Toolbar includes the logo, save button, restart button, and settings button equipped with the
 * settings pop-up.
 */
export function Toolbar (): React.ReactNode {
  return (
    <header className='bg-accent text-accent-content rounded-b-md'>
      <Navbar>
        <Navbar.Start>
          <img src={logo} width={56} />
          <h1 className='text-3xl font-bold ml-2 scale-y-110 max-sm:hidden'>Unitree</h1>
        </Navbar.Start>

        <Navbar.Center>
          <WorkspaceManager />
        </Navbar.Center>

        <Navbar.End>
          <GuideButton />
          <SettingsButton />
        </Navbar.End>
      </Navbar>
    </header>
  )
}
