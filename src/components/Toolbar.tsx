/**
 * The top toolbar component. User customization, workspacing, and other settings are managed here
*/
import { Fragment, useState } from 'react'

import { useSettings } from '../hooks/useSettings'

import { Modal, Navbar } from 'react-daisyui'

import logo from '../images/unitree_logo_noWords.png'

function SettingsButton (): React.ReactNode {
  const { settings, setters } = useSettings()
  const { Dialog, handleShow } = Modal.useDialog()

  return (
    <div>
      <button className='group inline-flex justify-center items-center cursor-pointer overflow-clip size-12' onClick={handleShow}>
        <div className='transition duration-500 symbol text-3xl group-hover:rotate-90'>settings</div>
      </button>

      <Dialog>
        <Modal.Body>
          <Modal.Header>Settings</Modal.Header>
          bruh
        </Modal.Body>
      </Dialog>
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
          <h1 className='text-2xl font-bold ml-2'>Unitree</h1>
        </Navbar.Start>

        <Navbar.End>
          <SettingsButton />
        </Navbar.End>
      </Navbar>
    </header>
  )
}
