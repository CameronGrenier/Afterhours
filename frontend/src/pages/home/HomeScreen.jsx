import Surface from "../../components/Surface";
import Button from "../../components/Button";
import Input from "../../components/Input";

import Annotation from "./Annotation";

/**
 * Renders the home screen with "Host" and "Join" options.
 *
 * Displays:
 *   - Host button: creates a new party
 *   - Join form: party code input and join button
 *   - Annotations: helpful labels pointing to key UI elements
 *
 * @returns {React.ReactNode} Home screen content
 */
export default function HomeScreen({
  isMobileLandscape,
  setPartyCode,
  setScreen,
  handleCreateLobby,
  handleJoinLobby,
}) {
  return (
    <>
      {/* Host Button Section */}
      <div className="relative w-full">
        <Button variant={"dark"} onClick={() => handleCreateLobby()}>
          Host
        </Button>
        {/* Responsive annotation for Host button */}
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

      {/* Join Party Form Section */}
      <Surface>
        <div className="relative flex flex-col gap-2">
          {/* Party code input field */}
          <Input
            type="text"
            placeholderText="Party Code"
            onChange={(inputText) => setPartyCode(inputText)}
            className="uppercase placeholder:lowercase"
          />

          {/* Join button */}
          <Button
            variant="dark"
            onClick={() => {
              setScreen("join");
            }}
          >
            Join
          </Button>

          {/* Responsive annotation for Join form */}
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
    </>
  );
}
