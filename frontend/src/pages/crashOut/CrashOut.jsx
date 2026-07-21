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
        <main>
            <SettingsPanel/>
            <MembersPanel/>
            <header className='w-full flex justify-center items-center z-[3]'>
            <h1 className='text-3xl lg:text-4xl font-display uppercase text-white'>afterhours</h1>
            </header>
            <CrashOutGame/>
        </main>
    )
}