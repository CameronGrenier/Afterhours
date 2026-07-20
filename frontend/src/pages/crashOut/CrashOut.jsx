import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'; 
import { usePartyContext } from '@/hooks/usePartyContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';

import SettingsPanel from "@/components/SettingsPanel";
import MembersPanel from "@/components/MembersPanel";

export default function CrashOutPage(){
    return(
        <main>
            <SettingsPanel/>
            <MembersPanel/>
        </main>
    )
}