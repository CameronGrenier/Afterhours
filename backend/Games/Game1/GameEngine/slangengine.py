"""
- each word must start with the last letter of the previous word
- Minimum word length is 3 letters
- 15 seconds to submit a word - running out of time costs a life
- Words in database are a automatic pass - no vote
- unknown words are subject to a bullsh*t vote
- if more than 40% of players vote bullsh*t, player loses a life
- losing a life ends current round
- turn order is random in the first round, then fixed rotation to other subsequent rounds
- First to lose all 3 lives is the loser, subject to the chosen punishment.
- If drinking enabled, after each life is lost, player must take a drink.
"""
import asyncio
import math
import random
import string
import time
from typing import Any, Dict, Tuple

from Games.Game1.GameEngine.playerclass import SlangPlayer as SlangPlayerClass
from Games.Game1.GameEngine.word_bank import word_bank


class SlangEngine:
    # Adjustable game parameters, can be changed through testing
    MINIMUM_PLAYERS = 2
    STARTING_LIVES = 3
    TURN_SECONDS = 15
    VOTE_SECONDS = 15
    VOTE_THRESHOLD_PERCENT = 40
    MIN_WORD_LENGTH = 3
    CATEGORY = "Slang Words"
    DRINKING_PAUSE_SECONDS = 4  # how long the drinking beat holds before the next round

    def __init__(self, players, sio, room):
        """
        :param players: A list of unique string usernames present in the lobby,
            in join order — this becomes the fixed turn order.
        :param sio: The AsyncServer socket instance passed down from RoomManager.
        :param room: The unique string room code used for broadcasting.
        """
        print(f"[SlangEngine::__init__] Spin-up sequence initiated for Room: '{room}'")
        print(f"[SlangEngine::__init__] Initial player list received: {players}")

        self.turn_order = list(players)
        self.game_players: Dict[str, SlangPlayerClass] = {
            name: SlangPlayerClass(name) for name in self.turn_order
        }
        self.sio = sio
        self.room = room

        self.phase = "seating"
        self.confirmed = set()
        self._all_confirmed_event = asyncio.Event()

        self.round_number = 0
        self.turn_number = 0
        self.current_index = 0
        self.round_required_letter = None
        self.chain = []  # accepted words this round

        # Bullsh*t-vote state for the word currently being voted (None if none pending)
        self.pending_word = None
        self.pending_submitter = None
        self.votes = set()

        # `_turn_id` invalidates stale timeout watchers once a turn resolves early
        # (word accepted/rejected before the clock ran out).
        self._turn_id = 0
        self._turn_timer_task = None
        self._vote_timer_task = None

        self.game_task = None

        print(f"[SlangEngine::__init__] Engine initialized successfully. Registered players: {list(self.game_players.keys())}")

    # lifecycle
    async def start(self) -> None:
        print(f"[SlangEngine::start] Triggering game start broadcast for Room: '{self.room}'")
        await self.sio.emit(
            "game_update",
            {
                "type": "START_GAME",
                "payload": {
                    "game": "Slang!",
                    "starting_lives": self.STARTING_LIVES,
                    "turn_order": self.turn_order,
                },
            },
            room=self.room,
        )
        print("[SlangEngine::start] START_GAME event emitted. Broadcasting seating state...")
        await self._broadcast_seating_state()
        
        print("[SlangEngine::start] Creating background game loop task...")
        self.game_task = asyncio.create_task(self.run_game_loop())

    async def run_game_loop(self) -> None:
        """
        Unlike Crash Out's clock-driven loop, Slang! is turn-driven: once the
        first turn is broadcast, every further transition (word accepted,
        vote resolved, timer expired) is triggered reactively from
        handle_event or a per-turn timeout watcher — not polled here. So this
        loop's only job is waiting out the seating phase, then kicking off
        round one.
        """
        print("[SlangEngine::run_game_loop] Game loop task started. Waiting for all players to confirm ready...")
        try:
            await self._all_confirmed_event.wait()
            print("[SlangEngine::run_game_loop] Event _all_confirmed_event triggered! Kicking off Round 1.")
            self.round_number = 1
            self._start_new_round(first_round=True)
            await self._advance_to_next_turn()
        except asyncio.CancelledError:
            print("[SlangEngine::run_game_loop] Game loop tracking thread was explicitly terminated.")

    async def end_game(self) -> None:
        print(f"[SlangEngine::end_game] Game ending for Room: '{self.room}'. Transitioning phase to 'game_over'.")
        self.phase = "game_over"
        
        print("[SlangEngine::end_game] Cancelling active turn and vote timers...")
        self._cancel_turn_timer()
        self._cancel_vote_timer()
        
        print(f"[SlangEngine::end_game] Emitting END_GAME broadcast to Room: '{self.room}'")
        await self.sio.emit("game_update", {"type": "END_GAME", "payload": {}}, room=self.room)

    def stop(self) -> None:
        print(f"[SlangEngine::stop] Stopping engine. Checking game_task status...")
        if self.game_task is not None and not self.game_task.done():
            print("[SlangEngine::stop] Cancelling active game_task asyncio task.")
            self.game_task.cancel()
        else:
            print("[SlangEngine::stop] No active game_task to cancel.")

    def add_player(self, player_name: str) -> None:
        print(f"[SlangEngine::add_player] Attempting to add player: '{player_name}'")
        if player_name in self.game_players:
            print(f"[SlangEngine::add_player] Player '{player_name}' already exists in game_players. Skipping.")
            return

        self.game_players[player_name] = SlangPlayerClass(player_name)
        self.turn_order.append(player_name)
        self.confirmed.discard(player_name)
        self.votes.discard(player_name)
        print(f"[SlangEngine::add_player] Player '{player_name}' added. Updated turn_order: {self.turn_order}")

    def remove_player(self, player_name: str) -> None:
        print(f"[SlangEngine::remove_player] Attempting to remove player: '{player_name}'")
        if player_name in self.game_players:
            self.game_players.pop(player_name, None)
            self.turn_order = [name for name in self.turn_order if name != player_name]
            self.confirmed.discard(player_name)
            self.votes.discard(player_name)
            print(f"[SlangEngine::remove_player] Removed '{player_name}'. Updated turn_order: {self.turn_order}")

            if self.pending_submitter == player_name:
                print(f"[SlangEngine::remove_player] Removed player '{player_name}' was the pending submitter! Resetting pending vote state.")
                self.pending_word = None
                self.pending_submitter = None
                self._cancel_vote_timer()

            if self.phase == "turn" and self.turn_order and self.current_player() == player_name:
                print(f"[SlangEngine::remove_player] Removed player '{player_name}' was the active turn player! Cancelling turn timer.")
                self._cancel_turn_timer()
        else:
            print(f"[SlangEngine::remove_player] Player '{player_name}' not found in game_players.")

    # Player-driven events
    async def handle_event(self, username: str, event_type: str, data: Dict[str, Any]) -> Tuple[bool, str, Any, Any]:
        print(f"[SlangEngine::handle_event] Received event_type='{event_type}' from user='{username}' | Data: {data}")

        if username not in self.game_players:
            print(f"[SlangEngine::handle_event] User validation failed: '{username}' is not registered in room '{self.room}'")
            return False, "User validation failed: Player not associated with this game room.", None, None

        if event_type == "confirm_ready":
            return await self._handle_confirm_ready(username)
        elif event_type == "submit_word":
            return await self._handle_submit_word(username, data or {})
        elif event_type == "vote_bullshit":
            return await self._handle_vote_bullshit(username)
        elif event_type == "chat_message":
            return self._handle_chat_message(username, data or {})
        else:
            print(f"[SlangEngine::handle_event] Unrecognized event_type: '{event_type}'")
            return False, f"Unrecognized engine instruction keyword: '{event_type}'.", {}, {}

    async def _handle_confirm_ready(self, username) -> Tuple[bool, str, Any, Any]:
        print(f"[SlangEngine::_handle_confirm_ready] Processing confirm_ready for user='{username}' | Current Phase='{self.phase}'")
        if self.phase != "seating":
            print(f"[SlangEngine::_handle_confirm_ready] Rejected: Game is not in seating phase (Current: '{self.phase}').")
            return False, "The game has already started.", None, None

        if username in self.confirmed:
            print(f"[SlangEngine::_handle_confirm_ready] User '{username}' was already confirmed. Current confirmed set: {self.confirmed}")
            return True, f"{username} already confirmed.", {"confirmed": True}, None

        print(f"[SlangEngine::_handle_confirm_ready] Adding '{username}' to confirmed set.")
        self.confirmed.add(username)
        broadcast = {"confirmed": sorted(self.confirmed), "total": len(self.turn_order)}

        print(f"[SlangEngine::_handle_confirm_ready] Confirmed status: {len(self.confirmed)}/{len(self.turn_order)}")
        if len(self.confirmed) == len(self.turn_order):
            print("[SlangEngine::_handle_confirm_ready] All players confirmed ready! Unblocking _all_confirmed_event.")
            self._all_confirmed_event.set()

        return True, f"{username} confirmed ready.", {"confirmed": True}, broadcast

    async def _handle_submit_word(self, username: str, data: Dict[str, Any]) -> Tuple[bool, str, Any, Any]:
        print(f"[SlangEngine::_handle_submit_word] Word submission attempt by user='{username}' | Phase='{self.phase}'")
        
        if self.phase != "turn":
            print(f"[SlangEngine::_handle_submit_word] Rejected: Phase is '{self.phase}', expected 'turn'.")
            return False, "There's no active turn to submit a word for.", None, None
        
        if username != self.current_player():
            print(f"[SlangEngine::_handle_submit_word] Rejected: User '{username}' submitted word out of turn. Current turn: '{self.current_player()}'.")
            return False, "It's not your turn.", None, None
        
        if self.pending_word is not None:
            print(f"[SlangEngine::_handle_submit_word] Rejected: Pending vote already active for word '{self.pending_word}'.")
            return False, "A bullsh*t vote is already in progress.", None, None

        word = str(data.get("word", "")).strip().lower()
        required_letter = self._current_required_letter()
        print(f"[SlangEngine::_handle_submit_word] Processing submitted word: '{word}' | Required starting letter: '{required_letter}'")

        if len(word) < self.MIN_WORD_LENGTH:
            reason = f'must be at least {self.MIN_WORD_LENGTH} letters'
            print(f"[SlangEngine::_handle_submit_word] Word '{word}' REJECTED: Length ({len(word)}) < MIN_WORD_LENGTH ({self.MIN_WORD_LENGTH}).")
            return (
                True,
                "Word is too short. REJECTED!",
                {"accepted": False, "reason": reason},
                {"word": word, "reason": reason},
            )

        if not word.startswith(required_letter):
            reason = f'must start with "{required_letter.upper()}"'
            print(f"[SlangEngine::_handle_submit_word] Word '{word}' REJECTED: Does not start with required letter '{required_letter}'.")
            return (
                True,
                "Pay attention to the starting letter! REJECTED!",
                {"accepted": False, "reason": reason},
                {"word": word, "reason": reason},
            )

        print("[SlangEngine::_handle_submit_word] Word passed basic format checks. Cancelling active turn timer.")
        self._cancel_turn_timer()

        if word_bank.contains(word, self.CATEGORY):
            print(f"[SlangEngine::_handle_submit_word] Word '{word}' FOUND in word_bank for category '{self.CATEGORY}'. Instant accept!")
            self.chain.append(word)
            self.current_index = (self.current_index + 1) % len(self.turn_order)
            print(f"[SlangEngine::_handle_submit_word] Updated chain: {self.chain} | Next player index: {self.current_index} ({self.current_player()})")
            await self._advance_to_next_turn()
            return True, "Your word valid", {"accepted": True}, {"word": word, "result": "accepted"}

        # Bullsh*t vote required: set up the vote state and start the vote timer.
        print(f"[SlangEngine::_handle_submit_word] Word '{word}' NOT in word_bank. Triggering Bullsh*t vote sequence.")
        self.pending_word = word
        self.pending_submitter = username
        self.votes = set()
        self._vote_timer_task = asyncio.create_task(self._vote_timeout_watch(word, self._turn_id))
        print(f"[SlangEngine::_handle_submit_word] Vote timer started for word '{word}' (turn_id={self._turn_id}). Broadcasting turn state...")
        await self._broadcast_turn_state()
        return (
            True,
            "Thats some BULLSH*T! Vote now to see if your word is accepted or rejected.",
            {"accepted": None, "pending_vote": True},
            {"word": word, "result": "pending_vote"},
        )

    async def _handle_vote_bullshit(self, username: str) -> Tuple[bool, str, Any, Any]:
        print(f"[SlangEngine::_handle_vote_bullshit] User '{username}' attempting to vote bullshit on pending word '{self.pending_word}'")
        
        if self.phase != "turn" or self.pending_word is None:
            print("[SlangEngine::_handle_vote_bullshit] Rejected: No active word pending vote.")
            return False, "There arent any words up here", None, None
        
        if username == self.pending_submitter:
            print(f"[SlangEngine::_handle_vote_bullshit] Rejected: User '{username}' tried to vote on their own submitted word.")
            return False, "Cmon Now, You can't vote on your own word.", None, None
        
        if username in self.votes:
            print(f"[SlangEngine::_handle_vote_bullshit] Ignored: User '{username}' already voted. Current votes: {self.votes}")
            return True, "You already voted, dude. Relax.", {"voted": True}, None

        self.votes.add(username)
        votes_needed = self._votes_needed()
        print(f"[SlangEngine::_handle_vote_bullshit] Vote recorded for '{username}'. Votes count: {len(self.votes)}/{votes_needed}")
        broadcast = {"voteCount": len(self.votes), "votesNeeded": votes_needed}

        if len(self.votes) >= votes_needed:
            print(f"[SlangEngine::_handle_vote_bullshit] VOTE PASSED! ({len(self.votes)} >= {votes_needed}). Word '{self.pending_word}' is declared BULLSH*T!")
            word = self.pending_word
            submitter = self.pending_submitter
            self.pending_word = None
            self.pending_submitter = None
            self._cancel_vote_timer()
            print(f"[SlangEngine::_handle_vote_bullshit] Triggering life loss for submitter '{submitter}'...")
            await self._lose_life(submitter, reason="bullshit_vote")
        else:
            print(f"[SlangEngine::_handle_vote_bullshit] Vote threshold not yet met. Broadcasting state update...")
            await self._broadcast_turn_state()

        return True, "Vote recorded.", {"voted": True}, broadcast

    def _handle_chat_message(self, username: str, data: Dict[str, Any]) -> Tuple[bool, str, Any, Any]:
        text = str(data.get("text", "")).strip()
        print(f"[SlangEngine::_handle_chat_message] Chat message from user='{username}': '{text}'")
        if not text:
            print("[SlangEngine::_handle_chat_message] Rejected: Empty message.")
            return False, "Message can't be empty.", None, None
        return True, "Message sent.", {}, {"text": text}

    # TURNS
    def current_player(self) -> str:
        player = self.turn_order[self.current_index]
        return player

    def _current_required_letter(self) -> str:
        required = self.chain[-1][-1] if self.chain else self.round_required_letter
        return required

    def _start_new_round(self, first_round: bool = False) -> None:
        print(f"[SlangEngine::_start_new_round] Starting round {self.round_number} | first_round={first_round}")
        self.chain = []
        eligible_letters = word_bank.letters_with_words(self.CATEGORY) or list(string.ascii_lowercase)
        self.round_required_letter = random.choice(eligible_letters)
        print(f"[SlangEngine::_start_new_round] Selected starting letter: '{self.round_required_letter.upper()}' from eligible set: {eligible_letters}")

        if first_round:
            self.current_index = random.randrange(len(self.turn_order))
            print(f"[SlangEngine::_start_new_round] First round random seating index selected: {self.current_index} ({self.current_player()})")

    async def _advance_to_next_turn(self) -> None:
        self._turn_id += 1
        turn_id = self._turn_id
        self.turn_number += 1
        self.pending_word = None
        self.pending_submitter = None
        self.votes = set()
        self.phase = "turn"

        print(f"[SlangEngine::_advance_to_next_turn] Advancing to Turn {self.turn_number} (turn_id={turn_id}). Current player: '{self.current_player()}', Required Letter: '{self._current_required_letter()}'")

        await self._broadcast_turn_state()
        print(f"[SlangEngine::_advance_to_next_turn] Scheduling turn timer watcher ({self.TURN_SECONDS}s) for turn_id={turn_id}...")
        self._turn_timer_task = asyncio.create_task(self._turn_timeout_watch(turn_id))

    async def _turn_timeout_watch(self, turn_id: int) -> None:
        print(f"[SlangEngine::_turn_timeout_watch] Turn timeout watcher started for turn_id={turn_id} ({self.TURN_SECONDS} seconds)")
        try:
            await asyncio.sleep(self.TURN_SECONDS)
        except asyncio.CancelledError:
            print(f"[SlangEngine::_turn_timeout_watch] Turn timer cancelled for turn_id={turn_id}")
            return
        
        print(f"[SlangEngine::_turn_timeout_watch] Turn timer expired for turn_id={turn_id}. Validating state (current _turn_id={self._turn_id})...")
        if turn_id != self._turn_id or self.pending_word is not None:
            print(f"[SlangEngine::_turn_timeout_watch] Timer stale or word pending vote. Ignoring timeout for turn_id={turn_id}.")
            return

        # Clear our own reference *before* calling _lose_life: that method calls
        # _cancel_turn_timer(), and since this coroutine IS self._turn_timer_task,
        # leaving the reference set would cancel this very task mid-execution and
        # silently abort everything after the "drinking" broadcast.
        self._turn_timer_task = None
        print(f"[SlangEngine::_turn_timeout_watch] TIMEOUT TRIGGERED! Player '{self.current_player()}' ran out of time.")
        await self._lose_life(self.current_player(), reason="timeout")

    async def _vote_timeout_watch(self, word: str, turn_id: int) -> None:
        print(f"[SlangEngine::_vote_timeout_watch] Vote timer started for word='{word}', turn_id={turn_id} ({self.VOTE_SECONDS} seconds)")
        try:
            await asyncio.sleep(self.VOTE_SECONDS)
        except asyncio.CancelledError:
            print(f"[SlangEngine::_vote_timeout_watch] Vote timer cancelled for word='{word}', turn_id={turn_id}")
            return

        print(f"[SlangEngine::_vote_timeout_watch] Vote timer expired for word='{word}', turn_id={turn_id}. Checking validity...")
        # if vote is resolved, move on
        if turn_id != self._turn_id or self.pending_word != word:
            print(f"[SlangEngine::_vote_timeout_watch] Stale vote timer event ignored for word='{word}'.")
            return
    
        self._vote_timer_task = None
        print(f"[SlangEngine::_vote_timeout_watch] Vote timeout reached without enough bullshit votes! Word '{word}' SURVIVES.")
        # if vote fails and word passes, added into database to be set under review
        print(f"[SlangEngine::_vote_timeout_watch] Adding candidate word '{word}' (by '{self.pending_submitter}') to candidate word bank.")
        word_bank.add_candidate(word, added_by=self.pending_submitter)
        self.pending_word = None
        self.pending_submitter = None
        self.chain.append(word)
        self.current_index = (self.current_index + 1) % len(self.turn_order)
        print(f"[SlangEngine::_vote_timeout_watch] Word accepted into chain: {self.chain}. Advancing turn...")
        await self._advance_to_next_turn()

    async def _lose_life(self, player_name: str, reason: str) -> None:
        print(f"[SlangEngine::_lose_life] Player '{player_name}' losing a life! Reason: '{reason}'")
        player = self.game_players[player_name]
        fails_before = player.fails
        player.life_lost()
        fails_after = player.fails
        print(f"[SlangEngine::_lose_life] '{player_name}' life loss recorded. Fails before: {fails_before} -> Fails after: {fails_after}/{self.STARTING_LIVES}")

        self.phase = "drinking"
        print("[SlangEngine::_lose_life] Phase changed to 'drinking'. Cancelling active turn and vote timers...")
        self._cancel_turn_timer()
        self._cancel_vote_timer()

        next_index = (self.turn_order.index(player_name) + 1) % len(self.turn_order)
        next_player = self.turn_order[next_index]
        chain_word = self.chain[-1] if self.chain else self.round_required_letter.upper()

        print(f"[SlangEngine::_lose_life] Emitting drinking phase broadcast to Room: '{self.room}'...")
        await self.sio.emit(
            "game_update",
            {
                "type": "PHASE_CHANGE",
                "payload": {
                    "phase": "drinking",
                    "playerName": player_name,
                    "reason": reason,
                    "failsBefore": fails_before,
                    "failsAfter": fails_after,
                    "livesTotal": self.STARTING_LIVES,
                    "nextPlayerName": next_player,
                    "chainWord": chain_word,
                },
            },
            room=self.room,
        )
        
        print(f"[SlangEngine::_lose_life] Sleeping for DRINKING_PAUSE_SECONDS ({self.DRINKING_PAUSE_SECONDS}s)...")
        await asyncio.sleep(self.DRINKING_PAUSE_SECONDS)

        if fails_after >= self.STARTING_LIVES:
            print(f"[SlangEngine::_lose_life] ELIMINATION TRIGGERED! Player '{player_name}' reached maximum fails ({fails_after}/{self.STARTING_LIVES}).")
            player.eliminated = True
            await self._broadcast_blackout(player_name)
            await self.end_game()
            return

        print(f"[SlangEngine::_lose_life] Player '{player_name}' survived elimination. Starting next round...")
        self.current_index = next_index
        self.round_number += 1
        self._start_new_round()
        await self._advance_to_next_turn()

    async def _broadcast_blackout(self, eliminated_player: str) -> None:
        print(f"[SlangEngine::_broadcast_blackout] Setting phase to 'blackout' for eliminated player: '{eliminated_player}'")
        self.phase = "blackout"
        standings = sorted(
            ({"name": name, "fails": p.fails} for name, p in self.game_players.items()),
            key=lambda s: s["fails"],
        )
        print(f"[SlangEngine::_broadcast_blackout] Final standings computed: {standings}")
        await self.sio.emit(
            "game_update",
            {
                "type": "PHASE_CHANGE",
                "payload": {
                    "phase": "blackout",
                    "eliminatedPlayer": eliminated_player,
                    "livesTotal": self.STARTING_LIVES,
                    "standings": standings,
                },
            },
            room=self.room,
        )

    def _votes_needed(self) -> int:
        eligible = max(len(self.turn_order) - 1, 1)  # everyone but the submitter
        needed = math.floor(eligible * self.VOTE_THRESHOLD_PERCENT / 100) + 1
        print(f"[SlangEngine::_votes_needed] Total players: {len(self.turn_order)}, Eligible voters: {eligible}, Needed: {needed} ({self.VOTE_THRESHOLD_PERCENT}%)")
        return needed

    # -------------------------------------------------------------------
    # Broadcast helpers
    # -------------------------------------------------------------------
    async def _broadcast_seating_state(self) -> None:
        print(f"[SlangEngine::_broadcast_seating_state] Broadcasting seating state to room '{self.room}'...")
        await self.sio.emit(
            "game_update",
            {
                "type": "PHASE_CHANGE",
                "payload": {
                    "phase": "seating",
                    "confirmed": sorted(self.confirmed),
                    "total": len(self.turn_order),
                },
            },
            room=self.room,
        )

    async def _broadcast_turn_state(self) -> None:
        payload = {
            "phase": "turn",
            "category": self.CATEGORY,
            "turnNumber": self.turn_number,
            "currentPlayer": self.current_player(),
            "previousWord": self.chain[-1] if self.chain else None,
            "requiredLetter": self._current_required_letter(),
            "fails": {name: p.fails for name, p in self.game_players.items()},
            "livesTotal": self.STARTING_LIVES,
            "timeLeft": self.TURN_SECONDS,
            "pendingWord": self.pending_word,
            "voteCount": len(self.votes),
            "votesNeeded": self._votes_needed(),
            "voteThreshold": self.VOTE_THRESHOLD_PERCENT,
            "votedPlayers": sorted(self.votes),
        }
        print(f"[SlangEngine::_broadcast_turn_state] Broadcasting turn state for Turn {self.turn_number} to room '{self.room}'. Current player: '{self.current_player()}'")
        await self.sio.emit("game_update", {"type": "PHASE_CHANGE", "payload": payload}, room=self.room)

    def _cancel_turn_timer(self) -> None:
        if self._turn_timer_task is not None and not self._turn_timer_task.done():
            print("[SlangEngine::_cancel_turn_timer] Cancelling active turn_timer_task...")
            self._turn_timer_task.cancel()
        else:
            print("[SlangEngine::_cancel_turn_timer] No active turn_timer_task to cancel.")
        self._turn_timer_task = None

    def _cancel_vote_timer(self) -> None:
        if self._vote_timer_task is not None and not self._vote_timer_task.done():
            print("[SlangEngine::_cancel_vote_timer] Cancelling active vote_timer_task...")
            self._vote_timer_task.cancel()
        else:
            print("[SlangEngine::_cancel_vote_timer] No active vote_timer_task to cancel.")
        self._vote_timer_task = None