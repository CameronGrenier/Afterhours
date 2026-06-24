import { useState } from 'react'
import { useLocation } from 'react-router-dom';
import { usePartyContext } from '@/hooks/usePartyContext';

import SettingsPanel from "@/components/SettingsPanel";
import MembersPanel from "@/components/MembersPanel";
import PartyCode from "@/components/PartyCode";

export default function RoomPage() {
  const { isMobile, partyCode, username, isHost } = usePartyContext();

  return (
    <main className='grid grid-rows-[auto_1fr]'>
      <header className='flex justify-center items-center p-[24px]'>
        <SettingsPanel/>
        <h1 className='text-4xl font-display uppercase text-white'>afterhours</h1>
        <MembersPanel/>
      </header>
      <h1>{username}</h1>


      {!isMobile && <PartyCode isCompact={true} position="br" partyCode={partyCode}/>}
    </main>
  );
}