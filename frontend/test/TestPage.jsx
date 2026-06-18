import React, { useState } from "react";
import Panel from "../src/components/Panel.jsx"
import PartyCode from "../src/components/PartyCode.jsx"
import "../src/components/MemberItem.jsx"
import MemberItem from "../src/components/MemberItem.jsx";
import { Users } from 'lucide-react'
import '../src/index.css'
import Input from "../src/components/Input.jsx";

export default function TestPage() {
  const [inputValue, setInputValue] = useState("");

  return (
    <main className="h-screen w-screen bg-black text-white">
      <h1 className="text-3xl font-bold">Test Page</h1>
      <p className="max-w-8/10">This is a testing page for any component a developer is working on.</p>
      <Panel
        header={
          <div className="w-full h-full flex justify-between items-center font-bold text-4xl tracking-tight px-5 py-4">
            <h1>Members</h1>
            <h1>4</h1>
          </div>
        }
        icon = {<Users size={40}/>}
        position="tr"
      >
        <div className="flex flex-col">
          <MemberItem username={"AdamSandler"}/>
          <MemberItem username={"MatureAdult"}/>
          <MemberItem username={"FunnyUsername"}/>
          <MemberItem username={"Batman"}/>
          <PartyCode partyCode={"ABCD"} isCompact = {true} position={"br"} />
        </div>
      </Panel>

      <div className="w-full flex justify-center items-center">
        <div className="w-[500px] flex flex-col gap-4">
          <PartyCode partyCode={"ABCD"} isCompact = {false} />
          <div className="flex flex-col items-center gap-2 bg-white w-full p-2 rounded-md border-2">
              <Input type="text" placeholderText="Username" onChange={setInputValue}/>
              <button 
                className="w-full bg-black text-2xl border-2 border-black font-medium py-3 rounded-md cursor-pointer hover:bg-white hover:text-black transition-colors duration-200"
                onClick={() => alert(`Input value: ${inputValue}`)}
              >
                Join
              </button>
          </div>
        </div>
      </div>
    </main>
  );
}