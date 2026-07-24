import { useContext } from "react";
import { SlangContext } from "@/components/SlangContext";
 
export function useSlangContext() {
  const context = useContext(SlangContext);
  if (!context) {
    throw new Error("useSlangContext must be used within a SlangProvider");
  }
  return context;
}