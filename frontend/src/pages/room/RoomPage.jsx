import { useState } from 'react'
import { useLocation } from 'react-router-dom';
import { usePartyContext } from '@/hooks/usePartyContext';

export default function RoomPage() {
  const { partyCode, username } = usePartyContext();
  console.log(partyCode, username);

  return (
    <div className='text-white'>
      Room Page
      <h1>{partyCode}</h1>
      <h1>{username}</h1>
    </div>
  );
}