import { Users, Zap, Trophy  } from "lucide-react";
import React, { useState, useRef } from "react";

import "@/index.css";

import Panel from "@/components/Panel.jsx";
import PartyCode from "@/components/PartyCode.jsx";
import MemberItem from "@/components/MemberItem.jsx";
import Input from "@/components/Input.jsx";
import Surface from "@/components/Surface.jsx";
import Button from "@/components/Button.jsx";
import Instructions from "@/components/Instructions.jsx";

export default function TestPage() {
  const [inputValue, setInputValue] = useState("");
  const instructionsRef = useRef(null);

  const instructions = [
    // Page 1 — centered stack, icon over text
    <div className="flex flex-col items-center gap-4 text-white text-center">
      <Users size={64} strokeWidth={2} />
      <p className="text-3xl font-bold tracking-tight">Gather your party</p>
      <p className="text-lg text-white/70 max-w-md">
        Share your 4-letter code so friends can join the same lobby.
      </p>
    </div>,

    // Page 2 — split row, big number beside text
    <div className="flex items-center gap-8 text-white">
      <span className="text-8xl font-bold tracking-tighter">3</span>
      <div className="flex flex-col gap-2 border-l-2 border-white/24 pl-8">
        <p className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Zap size={28} /> Rounds, fast
        </p>
        <p className="text-lg text-white/70 max-w-sm">
          Each round is quick. Answer before the timer runs out.
        </p>
      </div>
    </div>,

    // Page 3 — stacked badges, right-aligned
    <div className="flex flex-col items-end gap-3 text-white text-right">
      <Trophy size={48} strokeWidth={2} />
      <p className="text-3xl font-bold tracking-tight">Most points wins</p>
      <div className="flex gap-2">
        <span className="px-4 py-1 rounded-full border-2 border-white text-sm">1st</span>
        <span className="px-4 py-1 rounded-full border-2 border-white/40 text-sm">2nd</span>
        <span className="px-4 py-1 rounded-full border-2 border-white/20 text-sm">3rd</span>
      </div>
    </div>,
  ];

  return (
    <main className="h-screen w-screen bg-black text-white overflow-hidden">
      <h1 className="text-3xl font-bold">Test Page</h1>
      <p className="max-w-8/10">
        This is a testing page for any component a developer is working on.
      </p>
      <Panel
        header={
          <div className="w-full h-full flex justify-between items-center font-bold text-4xl tracking-tight px-5 py-4">
            <h1>Members</h1>
            <p>4</p>
          </div>
        }
        icon={<Users size={40} />}
        position="tr"
      >
        <div className="relative flex flex-col pb-24">
          <MemberItem username={"AdamSandler"} />
          <MemberItem username={"MatureAdult"} />
          <MemberItem username={"FunnyUsername"} />
          <MemberItem username={"Batman"} />
          <MemberItem username={"FunnyUsername2"} />
          <MemberItem username={"Spiderman"} />
          <MemberItem username={"Alec Baldwin"} />
          <MemberItem username={"UrMom"} />
          <PartyCode partyCode={"ABCD"} isCompact={true} position={"br"} />
        </div>
      </Panel>

      <Instructions ref={instructionsRef} instructions={instructions} />

      <div className="w-full flex justify-center items-center">
        <div className="w-[500px] flex flex-col gap-4">
          <Surface>
            <div className="flex flex-col items-center gap-2 w-full">
              <Input
                type="text"
                placeholderText="Username"
                onChange={setInputValue}
              />
              <Button
                variant="dark"
                ariaLabel="Create Party"
                onClick={() => alert(`username: ${inputValue}`)}
              >
                Join Party
              </Button>
            </div>
          </Surface>
          <Button
            variant="dark"
            onClick={() => instructionsRef.current?.showModal()}
          >
            open instructions
          </Button>
        </div>
      </div>
    </main>
  );
}
