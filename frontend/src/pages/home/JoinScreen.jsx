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
export default function JoinScreen({ setUsername, handleJoinLobby, handleCancel }) {
  return (
    <Surface>
      <div className="flex flex-col gap-2">
        {/* Username input field */}
        <Input type="text" placeholderText="Username" onChange={setUsername} />

        {/* Confirm join button */}
        <Button variant="dark" onClick={() => handleJoinLobby()}>
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
  );
}
