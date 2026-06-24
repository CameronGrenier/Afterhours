import { useState } from 'react'
import { useLocation } from 'react-router-dom';

export default function RoomPage() {
  const { state } = useLocation();
  const { partyCode, username } = state || {};
  console.log(partyCode, username);

  return (
    <div className='text-white'>
      Room Page
      <h1>{partyCode}</h1>
      <h1>{username}</h1>
    </div>
  );
}