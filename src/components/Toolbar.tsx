/**
 * The top toolbar component. User customization, workspacing, and other settings are managed here
 */
import React, {useState} from "react";
import logo from "../images/unitree_logo.png";

export function Toolbar (): React.ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <header>
      <div className='bg-[linear-gradient(180deg,hsla(126,34%,50%,1)_0%,hsla(126,34%,39%,1)_100%)] flex flex-row text-black font-bold items-center w-full rounded'>
        <img src={logo} alt="logo" className="max-w-16 max-h-16 aspect-auto ml-8"></img>
        <div className="flex flex-row justify-between w-full ml-200 mr-18">
          {/* Save Button (with alert functionality only)*/}
          <button className="duration-200 hover:text-white hover:cursor-pointer hover:scale-110 text-lg rounded-lg h-12 w-20 aspect-auto" 
          onClick={() => alert("Progress Saved")}>
            Save
          </button>
          {/* Restart Button (with alert functionality only) */}
          <button className="duration-200 hover:text-white hover:cursor-pointer hover:scale-110 text-lg rounded-lg h-12 w-20 aspect-auto"
          onClick={() => alert("Progress Restarted")}>
            Restart
          </button>
          {/* Settings Button (fully functional)*/}
          <button className="duration-200 hover:text-white hover:cursor-pointer hover:scale-110 text-lg rounded-lg h-12 w-20 aspect-auto"
          onClick={() => setIsOpen(true)}>
            Settings
          </button>
        </div>
      </div>

{/* Pop-up (not functional) */}
      {isOpen && (
        <div className="fixed inset-26 inset-x-120 bg-[#54ab5d] text-black rounded flex flex-col items-center justify-center z-50">
          <div className="justify-items-between h-1/2 w-1/2">
            <h1 className="mb-5 text-xl font-bold">Settings</h1>
          {/* Checkboxes (not functional) */}
            <div className="flex flex-col">
              <label className="hover:cursor-pointer">
                <input type="checkbox" className="hover:cursor-pointer"></input>
                Horizonal Divider
              </label>
              <label className="hover:cursor-pointer">
                <input type="checkbox" className="hover:cursor-pointer"></input>
                Dark Mode
              </label>
            </div>
          </div>
          <div>
          {/* Close Button for Pop-up (fully functional)*/}
            <button className="font-bold duration-200 hover:text-white hover:cursor-pointer hover:scale-110 text-lg rounded-lg h-12 w-20 aspect-auto" onClick={() => setIsOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </header>
  )
}
