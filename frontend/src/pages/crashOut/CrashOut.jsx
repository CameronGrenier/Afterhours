import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'; 
import { usePartyContext } from '@/hooks/usePartyContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import CrashOutGame from '@/components/CrashOutGame';
import { useCrashOutContext } from "@/hooks/useCrashoutContext";

import SettingsPanel from "@/components/SettingsPanel";
import MembersPanel from "@/components/MembersPanel";

export default function CrashOutPage(){
    const {gameState} = useCrashOutContext();
    return(
        <div className='flex flex-col h-dvh overflow-hidden [background-image:radial-gradient(circle_at_20%_20%,transparent_0,transparent_18%,#ff5b19_18.2%,transparent_18.5%),radial-gradient(circle_at_85%_30%,transparent_0,transparent_16%,#fff_16.2%,transparent_16.4%)]'>
          <SettingsPanel/>
          <MembersPanel/>
          <header className='w-full flex justify-center items-center z-[3] py-[24px]'>
          <h1 className='text-3xl lg:text-4xl font-display uppercase text-white'>afterhours</h1>
          </header>
          <CrashOutGame/>
        </div>
    )
}