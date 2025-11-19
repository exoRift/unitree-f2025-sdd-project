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

            <div className='space-y-1'>
              <label htmlFor='theme' className='font-bold text-lg'>Theme</label>

              <Select className='block' value={settings.theme} onChange={(e) => setters.theme(e.currentTarget.value as SettingsSchema['theme'])}>
                <Select.Option value='system'>System</Select.Option>
                <Select.Option value='light'>Light</Select.Option>
                <Select.Option value='dark'>Dark</Select.Option>
              </Select>
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
          <SettingsButton />
        </Navbar.End>
      </Navbar>
    </header>
  )
}
