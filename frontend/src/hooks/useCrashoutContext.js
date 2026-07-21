import { CrashOutContext } from "@/components/CrashOutContext";
import { useContext } from "react";

export function useCrashOutContext() {
  const ctx = useContext(CrashOutContext);
  if (!ctx)
    throw new Error(
      "useCrashOutContext must be used within a CrashOutProvider",
    );
  return ctx;
}
