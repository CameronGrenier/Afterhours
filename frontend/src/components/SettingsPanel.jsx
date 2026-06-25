import { usePartyContext } from "@/hooks/usePartyContext";
import { Bolt } from 'lucide-react';

import Panel from "./Panel";
import Slider from "./Slider";
import PartyCode from "./PartyCode";

export default function SettingsPanel() {
  const { partyCode, isMobile, sfxVolume, setSfxVolumeValue, musicVolume, setMusicVolumeValue} = usePartyContext();

  return (
    <Panel
      position="tl"
      icon={<Bolt size={40} color="#ffffff" fill="#000000" />}
      header={
        <div className="w-full text-white font-bold text-4xl tracking-tight px-5 py-4">
          Settings
        </div>
      }
    >
      <Slider
        sliderTitle="SoundsFx Volume"
        value={sfxVolume}
        onChange={setSfxVolumeValue}
      />
      {!isMobile && (
        <Slider
          sliderTitle="Music Volume"
          value={musicVolume}
          onChange={setMusicVolumeValue}
        />
      )}

      <PartyCode isCompact={true} partyCode={partyCode} position="bl" />
    </Panel>
  );
}
