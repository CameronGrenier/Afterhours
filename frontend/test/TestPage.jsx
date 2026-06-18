import '../src/index.css'
import { Users } from 'lucide-react'
import React, { useState } from "react";
import Panel from "../src/components/Panel.jsx"
import PartyCode from "../src/components/PartyCode.jsx"
import MemberItem from "../src/components/MemberItem.jsx";
import Input from "../src/components/Input.jsx";
import Surface from "../src/components/Surface.jsx";
import Button from "../src/components/Button.jsx";

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
            <Surface>
                <div className="flex flex-col items-center gap-2 w-full">
                    <Input type="text" placeholderText="Username" onChange={setInputValue} />
                    <Button variant="dark" ariaLabel="Create Party" onClick={() => alert(`username: ${inputValue}`)}>Join Party</Button>
                </div>
            </Surface>
        </div>
      </div>
    </main>
  );
}