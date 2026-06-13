import Panel from "../src/components/Panel.jsx"
import PartyCode from "../src/components/PartyCode.jsx"
import "../src/components/MemberItem.jsx"
import MemberItem from "../src/components/MemberItem.jsx";
import { Users } from 'lucide-react'
import '../src/index.css'

export default function TestPage() {
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
        </div>
      </Panel>
      <PartyCode partyCode={"ABCD"} isCompact = {false} position={"br"} />
      <PartyCode partyCode={"ABCD"} isCompact = {true} position={"br"} />
    </main>
  );
}