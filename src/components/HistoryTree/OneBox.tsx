// import React from 'react';
import { useEffect, useState } from "react";
import type { TreeNode, Tree } from "../../lib/history";
import { useTreeContext } from "../../App";

function UserMadeEquationParser({ initial }: { initial : unknown }) {
  //const tokens = initial.split(" ");

  return (
    <p className="text-center opacity-80 mb-2">
      placeholder (equation data type not decided yet)
      {/* {tokens.map((token, index) => (
        <span key={index} className={token.startsWith("$") ? "text-green-300" : ""}>
          {token}
        </span>
      ))} */}
    </p>
  );
}

// {id, userEquationName, equationString, note}: {id: string, userEquationName: string, equationString: string, note: string}

export function OneBox({data} : { data: TreeNode }) : React.ReactNode {
  const curNode : TreeNode = data;
  const { tree } = useTreeContext();

  let display_id : string = data.id;
  let display_alias : string = data.alias == undefined ? "Equation_"+data.id : data.alias;
  let display_equation : unknown = data.equation;
  let display_note : string = data.note == undefined ? "" : data.note;

  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleClick = (_event: MouseEvent) => {
      if (open) setOpen(false);
    };
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [open]);

  const handleLeave = (_ : any) => {
    if (open) setOpen(false);
  }
  const deleteNode = (_ : any) => {
    tree.deleteNode(curNode);
  }

  const handleClick = (e : React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation(); // e.preventDefault(); makes this run before useEffect
    const container = e.currentTarget.getBoundingClientRect();
    setMenuPos({ x: container.right - e.clientX, y: e.clientY - container.top });
    setOpen(!open);
  };

  return (
    <div onMouseLeave={handleLeave} className="relative p-3 rounded-2xl bg-neutral-800 text-neutral-content shadow-xl ring-1 ring-white/5 w-max min-w-[200px]">
      {/* Top-right hamburger */}
      <div className="absolute top-3 right-3 cursor-pointer" onClick={handleClick}>
        <div className="w-3 h-0.5 bg-white my-0.5"></div>
        <div className="w-3 h-0.5 bg-white my-0.5"></div>
        <div className="w-3 h-0.5 bg-white my-0.5"></div>
      </div>

      {/* Content */}
      <h3 className="text-lg font-bold">{display_id}</h3>
      <p className='text-lg mb-2 font-semibold'>{display_alias}</p>
      <UserMadeEquationParser initial={display_equation}/>
      {display_note != "" && (
        <div className="bg-neutral-700 rounded-2xl p-2 shadow-lg">
          <p>{display_note}</p>
        </div>
      )}

      {/* Floating menu */}
      {open && (
        <div
          className="absolute bg-neutral-700 text-white rounded shadow-lg py-2 w-max"
          style={{ top: menuPos.y, right: menuPos.x, transform: "translateX(90%) translateY(15px)" }}
        >
          <button className="block px-4 py-2 hover:bg-neutral-600 w-full text-left">Edit</button>
          <button className="block px-4 py-2 hover:bg-neutral-600 w-full text-left" onClick={deleteNode}>Delete</button>
        </div>
      )}
    </div>
  );
}