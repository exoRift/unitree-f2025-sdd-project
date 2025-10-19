/**
 * The top toolbar component. User customization, workspacing, and other settings are managed here
 */
import React, { useState } from 'react'
import logo from '../images/unitree_logo_noWords.png'

/**
 * Toolbar includes the logo, save button, restart button, and settings button equipped with the
 * settings pop-up.
 * @returns toolbar component
 */
export function Toolbar (): React.ReactNode {
  const [popupOpen, setPopupIsOpen] = useState(false)
  const [darkModeOn, setDarkModeOn] = useState(false)
  const [horizontalOn, setHorizonalOn] = useState(false)
  return (
    <header>
      <div className='lightBg toolbarFont flex flex-row text-white font-bold items-center w-full rounded'>
        <img src={logo} alt='logo' className='max-w-14 max-h-14 aspect-auto ml-8' />
        <p className='font-bold text-xl'>Unitree</p>
        <div className='flex flex-row justify-between w-full ml-180 mr-18'>
          {/* Save Button (with alert functionality only) */}
          <button className='duration-200 hover:text-[#7B3F16] hover:cursor-pointer hover:scale-110 text-lg rounded-lg h-12 w-20 aspect-auto' onClick={() => alert('Progress Saved')}>
            Save
          </button>
          {/* Restart Button (with alert functionality only) */}
          <button className='duration-200 hover:text-[#7B3F16] hover:cursor-pointer hover:scale-110 text-lg rounded-lg h-12 w-20 aspect-auto' onClick={() => alert('Progress Restarted')}>
            Restart
          </button>
          {/* Settings Button (fully functional) */}
          <button className='duration-200 hover:text-[#7B3F16] hover:cursor-pointer hover:scale-110 text-lg rounded-lg h-12 w-20 aspect-auto' onClick={() => setPopupIsOpen(true)}>
            Settings
          </button>
        </div>
      </div>

      {/* Pop-up (not functional) */}
      {popupOpen && (
        <div className='fixed inset-26 inset-x-120 toolbarFont lightBg text-white rounded flex flex-col items-center justify-center z-50'>
          <div className='justify-items-between h-1/2 w-1/2'>
            <h1 className='mb-5 text-xl font-bold'>Settings</h1>
            {/* Checkboxes (not functional) */}
            <div className='flex flex-col'>
              <label className='hover:cursor-pointer'>
                <input type='checkbox' className='hover:cursor-pointer' checked={horizontalOn} onChange={(e) => { setHorizonalOn(e.target.checked) }} />
                Horizonal Divider
              </label>
              <label className='hover:cursor-pointer'>
                <input type='checkbox' className='hover:cursor-pointer' checked={darkModeOn} onChange={(e) => { setDarkModeOn(e.target.checked) }} />
                Dark Mode
              </label>
            </div>
          </div>
          <div>
            {/* Close Button for Pop-up (fully functional) */}
            <button className='font-bold duration-200 hover:text-[#7B3F16] hover:cursor-pointer hover:scale-110 text-lg rounded-lg h-12 w-20 aspect-auto' onClick={() => setPopupIsOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </header>
  )
}
