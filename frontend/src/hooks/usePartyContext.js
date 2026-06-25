import { PartyContext } from "@/components/PartyContext";
import { useContext } from "react";

export function usePartyContext() {
  const ctx = useContext(PartyContext);
  if (!ctx) throw new Error("usePartyContext must be used within a PartyProvider");
  return ctx;
}