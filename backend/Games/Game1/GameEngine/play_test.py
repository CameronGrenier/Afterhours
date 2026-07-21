import asyncio
import sys
from pathlib import Path

"""
play_test.py

FILE IS STRICTLY FOR DEVELOPMENT / TESTING PURPOSES ONLY. It is not part of the production game code,
and is not used by the server or client in any way.
testing for SlangEngine from the terminal, without a browser or socket.io client.
first type in names of players using csv, then type in words for each player in turn, and vote on bullsh*t when prompted.


Usage:
    cd Games/Game1/GameEngine
    python3 play_test.py
"""


# slangengine.py imports itself via the full "Games.Game1.GameEngine.*"
# package path, so this script needs the repo root on sys.path too —
_REPO_ROOT = Path(__file__).resolve().parents[3]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from Games.Game1.GameEngine.slangengine import SlangEngine


class PrintSio:
    """Stands in for the real socket.io AsyncServer — instead of
    broadcasting to connected clients, it just prints what would have
    been sent, formatted for a terminal."""

    async def emit(self, event, payload, room=None):
        update_type = payload.get("type")
        p = payload.get("payload", {})

        if update_type == "START_GAME":
            print(f"\n🎮 Slang! starting. Turn order: {p['turn_order']}\n")

        elif update_type == "PHASE_CHANGE":
            phase = p.get("phase")
            if phase == "seating":
                print(f"Confirmed ready: {p['confirmed']} / {p['total']}")
            elif phase == "turn":
                print(f"\n--- Turn {p['turnNumber']}: {p['currentPlayer']}'s turn "
                      f"| required letter: '{p['requiredLetter'].upper()}' "
                      f"| previous word: {p.get('previousWord')} ---")
                print(f"    Fails so far: {p['fails']}")
                if p.get("pendingWord"):
                    print(f"      Vote pending on '{p['pendingWord']}' "
                          f"({p['voteCount']}/{p['votesNeeded']} votes needed)")
            elif phase == "drinking":
                print(f"\n {p['playerName']} lost a life! ({p['reason']}) "
                      f"Fails: {p['failsBefore']} -> {p['failsAfter']}. "
                      f"Next up: {p['nextPlayerName']}")
            elif phase == "blackout":
                print(f"\n {p['eliminatedPlayer']} is ELIMINATED.")
                print(f"    Standings: {p['standings']}")

        elif update_type == "END_GAME":
            print("\n🏁 GAME OVER 🏁\n")


async def ainput(prompt: str) -> str:
    """input() blocks the whole thread; running it in an executor keeps
    the event loop free so the real 15s turn/vote timers can still fire
    in the background while you're typing."""
    return await asyncio.get_event_loop().run_in_executor(None, input, prompt)


async def main() -> None:
    print("=== Slang! — play from the terminal ===")
    print("(You'll type as each player in turn. Type 'quit' anytime to bail out.)\n")

    raw = await ainput("Player names, comma-separated (blank = player1,player2): ")
    players = [n.strip() for n in raw.split(",") if n.strip()] or ["player1", "player2"]

    if len(players) < SlangEngine.MINIMUM_PLAYERS:
        print(f"Need at least {SlangEngine.MINIMUM_PLAYERS} players.")
        return

    sio = PrintSio()
    engine = SlangEngine(players, sio, room="cli-room")
    await engine.start()

    for p in players:
        await engine.handle_event(p, "confirm_ready", {})

    print(f"\nHeads up: TURN_SECONDS={engine.TURN_SECONDS}, "
          f"VOTE_SECONDS={engine.VOTE_SECONDS} — if you sit on a prompt too "
          f"long the real timer will fire and you'll lose a life, same as "
          f"the real game.\n")

    while engine.phase != "game_over":
        await asyncio.sleep(0.1)

        if engine.phase != "turn":
            continue

        if engine.pending_word is not None:
            for voter in players:
                if engine.pending_word is None:
                    break  # vote resolved while we were asking someone else
                if voter == engine.pending_submitter or voter in engine.votes:
                    continue
                ans = await ainput(
                    f"  {voter}: is '{engine.pending_word}' bullsh*t? (y/n/skip): "
                )
                if ans.strip().lower() == "quit":
                    return
                if ans.strip().lower() == "y":
                    await engine.handle_event(voter, "vote_bullshit", {})
        else:
            current = engine.current_player()
            required = engine._current_required_letter()
            word = await ainput(f"{current}, your word (starts with '{required.upper()}'): ")
            if word.strip().lower() == "quit":
                return
            ok, msg, result, _ = await engine.handle_event(
                current, "submit_word", {"word": word}
            )
            if result and result.get("accepted") is False:
                print(f" Rejected{msg}")

    print("Thanks for playing!")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nBye.")