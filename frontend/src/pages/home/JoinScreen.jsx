import { Undo2 } from "lucide-react";

import Surface from "../../components/Surface";
import Button from "../../components/Button";
import Input from "../../components/Input";

/**
 * Renders the join screen with username input and confirmation.
 *
 * Displays:
 *   - Username input field
 *   - Join button: submits username and party code
 *   - Cancel button: returns to home screen
 *
 * @returns {React.ReactNode} Join screen content
 */
export default function JoinScreen({
  mode,
  setUsername,
  handleJoinLobby,
  handleHostLobby,
  handleCancel,
}) {
  return (
    <div className="w-full max-w-[500px] flex flex-col gap-4 opacity-100 z-[3]">
      <h1 className="text-4xl font-bold text-white font-display uppercase text-center leading-none">
        afterhours
      </h1>
      <Surface>
        <div className="flex flex-col gap-2">
          {/* Username input field */}
          <Input
            type="text"
            placeholderText="Username"
            onChange={setUsername}
          />

          {/* Confirm join button */}
          <Button variant="dark" onClick={() => (mode === "join") ? handleJoinLobby() : handleHostLobby()}>
            Join
          </Button>

          {/* Return to home screen button */}
          <Button variant="danger" onClick={() => handleCancel()}>
            <div className="flex gap-2 items-center w-fit mx-auto">
              <Undo2 size={20} strokeWidth={3.2} />
              <span>Cancel</span>
            </div>
          </Button>
        </div>
      </Surface>
    </div>
  );
}
