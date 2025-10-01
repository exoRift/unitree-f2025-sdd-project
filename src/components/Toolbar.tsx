/**
 * The top toolbar component. User customization, workspacing, and other settings are managed here
 */
import logo from "../images/unitree_logo.png"

export function Toolbar (): React.ReactNode {
  return (
    <header>
      <div className='bg-[#5ac864] flex flex-row text-black font-bold items-center w-full rounded'>
        <img src={logo} alt="logo" className="max-w-20 max-h-20 aspect-auto pl-5"></img>
        <div className="flex flex-row justify-between w-full pl-200 pr-20">
          <button className="hover:bg-[#44c150] hover:cursor-pointer rounded-lg h-12 w-20 aspect-auto" 
          onClick={() => alert("Progress Saved")}>
            Save
          </button>
          <button className="hover:bg-[#44c150] hover:cursor-pointer rounded-lg h-12 w-20 aspect-auto"
          onClick={() => alert("Progress Restarted")}>
            Restart
          </button>
          <button className="hover:bg-[#44c150] hover:cursor-pointer rounded-lg h-12 w-20 aspect-auto">
            Settings
          </button>
        </div>
      </div>
    </header>
  )
}
