import { useState, useEffect } from "react";

import { Bolt } from "lucide-react";
import topoLandscape from "./assets/Images/topology_bg_images/topology-landscape.webp";
import topoLandscape2x from "./assets/Images/topology_bg_images/topology-landscape@2x.webp";
import topoPortrait from "./assets/Images/topology_bg_images/topology-portrait.webp";
import topoPortrait2x from "./assets/Images/topology_bg_images/topology-portrait@2x.webp";
import topoUltrawide from "./assets/Images/topology_bg_images/topology-ultrawide.webp";

import { useMediaQuery } from "./hooks/useMediaQuery";
import Panel from "./components/Panel";
import Surface from "./components/Surface";
import Button from "./components/Button";
import Input from "./components/Input";
import Arrow from "./components/Arrow";

export default function App() {
  const isMobile = useMediaQuery("(max-width: 768px), (max-height: 768px)");
  const isMobileLandscape = useMediaQuery("(orientation: landscape)") && isMobile;

  const [screen, setScreen] = useState("home"); // 'home', 'join', 'lobby', 'room']
  const [partyCode, setPartyCode] = useState("");

  function handleJoin() {
    alert(`user wants to join party ${partyCode}`);
  }

  return (
    <main className="relative w-screen h-dvh px-8 flex flex-col items-center justify-center bg-black overflow-hidden">
      {/* Topology Background Image */}
      <picture className="fixed inset-0 z-[1]">
        {/* tall screens → portrait art */}
        <source
          media="(orientation: portrait)"
          srcSet={`${topoPortrait} 1x, ${topoPortrait2x} 2x`}
        />
        {/* 21:9 and wider → ultrawide art */}
        <source media="(min-aspect-ratio: 2/1)" srcSet={topoUltrawide} />
        {/* default → landscape art */}
        <img
          src={topoLandscape}
          srcSet={`${topoLandscape} 1x, ${topoLandscape2x} 2x`}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-10"
        />
      </picture>
      {/* Gradient Overlay for Background Image */}
      <div className="fixed inset-0 bg-[linear-gradient(to_top_left,#000_15%,45%,transparent)] z-[2]" />
      {isMobile && (
        <>
          <div className="fixed inset-0 bg-[linear-gradient(to_top,transparent_80%,black)] z-[2]" />
          <div className="fixed inset-0 bg-[linear-gradient(to_bottom,transparent_90%,black)] z-[2]" />
        </>
      )}

      <Panel
        position="tl"
        icon={<Bolt size={40} color="#ffffff" fill="#000000" />}
        header={
          <div className="w-full text-white font-bold text-4xl tracking-tight px-5 py-4">
            Settings
          </div>
        }
      ></Panel>

      {/* Main Content */}
      <div className="w-full max-w-[350px] flex flex-col gap-4 opacity-100 z-[3]">
        <h1 className="text-4xl font-bold text-white font-display uppercase text-center leading-none">
          afterhours
        </h1>
        <div className="relative w-full">
          <Button variant={"dark"} onClick={() => setScreen("host")}>
            Host
          </Button>
          {/* Host annotation  */}
          {isMobileLandscape ? (
            <Annotation
              d="M 60 72 C 60 54 60 15 8 8"
              label="Best on larger screens"
              className="right-0 bottom-0 translate-x-[110%] translate-y-[55%]"
              labelClassName="bottom-0 left-0 max-w-[20ch] rotate-18"
              width={150}
              height={170}
            />
          ) : (
            <Annotation
              d="M 80 27 C 86 35 112 51 96 101"
              label="Best on larger screens"
              className="right-0 top-0 translate-x-[10%] -translate-y-[110%]"
              labelClassName="top-0 right-0 max-w-[30ch] -rotate-18"
              width={140}
              height={170}
            />
          )}
        </div>
        <Surface>
          <div className="relative flex flex-col gap-2">
            <Input
              type={"text"}
              placeholderText={"Party Code"}
              onChange={(inputText) => setPartyCode(inputText)}
            />
            <Button variant={"dark"} onClick={() => handleJoin()}>
              Join
            </Button>
            {/* Surface annotation */}
            {isMobileLandscape ? (
              <Annotation
                d="M 60 72 C 60 54 60 15 112 8"
                label="Connect on mobile"
                className="left-0 bottom-0 -translate-x-[130%] translate-y-[0%]"
                labelClassName="bottom-0 right-0 max-w-[7ch] -rotate-18"
                width={140}
                height={170}
              />
            ) : (
              <Annotation
                d="M 60 72 C 40 54 42 26 50 8"
                label="Connect on mobile"
                className="left-0 bottom-0 -translate-x-[50%] translate-y-[100%]"
                labelClassName="bottom-0 right-0 max-w-[7ch] -rotate-18"
                width={140}
                height={170}
              />
            )}
          </div>
        </Surface>
      </div>
    </main>
  );
}

function Annotation({ d, label, className, labelClassName, width, height }) {
  return (
    <div
      aria-hidden="true"
      style={{ width, height }}
      className={`pointer-events-none absolute ${className}`}
    >
      <Arrow d={d} className="text-white absolute inset-0 w-full h-full" />
      <span
        className={`absolute font-thin text-xl text-white leading-[1] tracking-tight text-center ${labelClassName}`}
      >
        {label}
      </span>
    </div>
  );
}