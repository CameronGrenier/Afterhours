import { RefreshCcw } from "lucide-react";
import { useRef } from "react";
import Button from "./Button";
import { usePartyContext } from "@/hooks/usePartyContext";

export default function RotateDialog() {
  const { rotateDialogDismissed, setRotateDialogDismissed } = usePartyContext();
  return (
    <dialog
      className={`w-screen h-dvh ${rotateDialogDismissed ? "hidden" : "flex items-center justify-center"} bg-black z-[9999999]`}
    >
      <div className="max-w-[500px] flex flex-col items-center justify-center gap-2">
        <RefreshCcw color="white" size={80} strokeWidth={1} />
        <p>For the best experience rotate your phone to portrait</p>
        <Button onClick={() => setRotateDialogDismissed(true)}>
          <div className="flex flex-col items-center justify-center">
            <p className="text-xl">Nah I enjoy suffering.</p>
            <p className="text-sm">(we wont show this to you again)</p>
          </div>
        </Button>
      </div>
    </dialog>
  );
}
