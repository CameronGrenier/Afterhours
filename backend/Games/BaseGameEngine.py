from enum import Enum
from typing import Dict, Any, List, Tuple
import asyncio
from backend.Games.Game2.GameEngine.PlayerClass import PlayerClass


class GamePhases(Enum):
    """
    Tracks the internal states of your engine.
    Add custom phases here (e.g., SELECTION, VOTING, SHOWDOWN).
    """
    INITIALIZING = "initializing"
    ACTIVE = "active"
    GAME_OVER = "game_over"


class BaseGameEngine:
    # --- Configurable Class Constants ---
    MINIMUM_PLAYERS = 1
    DEFAULT_STARTING_SCORE = 100

    def __init__(self, players: List[str], sio: Any, room: str):
        """
        Initializes the stateful game container for a specific room instance.

        :param players: A list of unique string usernames present in the lobby.
        :param sio: The AsyncServer socket instance passed down from RoomManager.
        :param room: The unique string room code used for broadcasting data fields.
        """
        print(f"[Engine] Spin-up sequence initiated for Room: {room}")

        # Create a dictionary of player objects to quicky edit their data
        # Each Engine can have their own PlayerClass a Basic one currently exists in the Game2 folder
        self.game_players = {
            player: PlayerClass(player) for player in players
        }
        self.sio = sio
        self.room = room
        self.phase = GamePhases.INITIALIZING
        self.game_task = None

    async def start(self) -> None:
        """
        Triggers the initialization broadcast to all players in the room and
        spawns the core long-running game execution loop asynchronously.
        """
        print("[Engine] Triggering game start broadcast")

        # 1. Instruct all listening client views to close menus and load UI assets
        await self.sio.emit('game_update', {
            'type': 'START_GAME',
            'payload': {
                'game': 'Your Game Name Here',  # Change this to match your client-side filters
                'starting_score': self.DEFAULT_STARTING_SCORE,
            }
        }, room=self.room)

        # 2. Hand control off to background asyncio runtime task loop
        self.phase = GamePhases.ACTIVE
        self.game_task = asyncio.create_task(self.run_game_loop())

    async def run_game_loop(self) -> None:
        """
        The structural lifeline loop of your game engine.
        Handles linear state progressions, countdown delays, and phase management.
        """
        try:
            # Example Loop Structure (Adapt this to match your specific rules)
            for round_num in range(1, 4):  # Run 3 structural rounds
                print(f"[Engine] Commencing Round {round_num}")

                # Step A: Update Phase and alert the players
                await self.broadcast_phase_change("your_custom_phase_name")

                # Step B: Pause processing to allow player actions/inputs over network
                await asyncio.sleep(10)

                #Do whatever you want! Do into some input phase for users
                #Go into some vote phase
                #Go into some scoreboad phase
                #Do whatever you want!

                # Clean up and conclude room lifecycle
            await self.end_game()

        except asyncio.CancelledError:
            print("[Engine] Game loop tracking thread was explicitly terminated.")

    async def handle_event(self, username: str, event_type: str, data: Dict[str, Any]) -> Tuple[bool, str, Any, Any]:
        """
        Routes incoming raw network socket (or HTTP) signals directly into game updates.
        Must return 4 positional parameters back up to the GameRoom router wrapper:
        1. status (bool): True if operation was legal and evaluated successfully.
        2. message (str): Logs descriptive warnings or feedback text details.
        3. local_payload (dict): Private feedback returning exclusively to the player executing this request
        - If HTTP only local payload will be sent back. This is done once in crash out with 'get_score' for reference.
        4. broadcast_payload (dict): Public update data context shared to all room subscribers.
        -Does not happen with HTTP requests must be a socket communication for simplicity
        """
        print(f"[Engine] Processing event '{event_type}' received from client player: {username}")

        if username not in self.game_players:
            return False, "User validation failed: Player not associated with this game room.", None, None

        user = self.game_players[username]

        # --- EVENT ROUTING WORKFLOW EXAMPLES ---
        if event_type == "example_action":
            # Process state checks, evaluate points, adjust scores, etc.
            is_valid = True

            if is_valid:
                # Compile structural data context dictionaries
                local_ui_data = {"score": user.score, "action_confirmed": True}
                global_broadcast_data = {"player": username, "status_flag": "updated"}

                return True, "Action applied successfully.", local_ui_data, global_broadcast_data
            else:
                return False, "Action failed business validation conditions.", None, None

        # Fallback catch-all for unknown network requests
        return False, f"Unrecognized engine instruction keyword: '{event_type}'.", {}, {}

    async def broadcast_phase_change(self, phase_name: str, parameters: Dict[str, Any] = None) -> None:
        """
        Helper method to quickly alert clients when the game structural view transitions.
        Essentially a wrapper around emit, not nessesarry if you want to just code each emit
        like I did in Crash Out
        """
        payload = {'phase': phase_name}
        if parameters:
            payload.update(parameters)

        await self.sio.emit('game_update', {
            'type': 'PHASE_CHANGE',
            'payload': payload
        }, room=self.room)

    async def end_game(self) -> None:
        """
        Performs safe teardown sequences and alerts views to return back into lobby menus.
        """
        self.phase = GamePhases.GAME_OVER
        print("[Engine] Execution lifecycle completed. Broadcasing final conclusion...")

        await self.sio.emit('game_update', {
            'type': 'END_GAME',
            'payload': {
                # Add final tallies or podium placement summaries here
            }
        }, room=self.room)
