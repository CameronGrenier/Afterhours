import { usePartyContext } from "@/hooks/usePartyContext";
import { Users } from "lucide-react";

import MemberItem from "./MemberItem";
import Panel from "./Panel";

export default function MembersPanel() {
  const { players, handleKickPlayer, isHost } = usePartyContext();

  return (
    <Panel
      position="tr"
      icon={<Users size={40} color="#ffffff" fill="#000000" />}
      header={
        <div className="w-full flex justify-between text-white font-bold text-4xl tracking-tight px-5 py-4">
          <p>Members</p>
          <p>{players.length}</p>
        </div>
      }
    >
      <div className="relative flex flex-col pb-24">
        {players.map((player) => (
          <MemberItem
            key={player}
            username={player}
            onKick={handleKickPlayer}
            kickEnabled={isHost}
          />
        ))}
      </div>
    </Panel>
  );
}
