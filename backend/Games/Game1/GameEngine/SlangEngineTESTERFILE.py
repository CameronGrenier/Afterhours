import asyncio
import math
import random
import string
import time
from typing import Any, Dict, Tuple

from Games.Game1.GameEngine.SlangPlayerClass import SlangPlayerClass
from Games.Game1.GameEngine.word_bank import word_bank

"""
Slang! — word chain drinking game.

"""


class SlangEngine:
    # --- Configurable class constants ---
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
        print(f"[SlangEngine] Spin-up sequence initiated for Room: {room}")

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

        # Bullsh*t-vote state for the word currently on the table (None if none pending)
        self.pending_word = None
        self.pending_submitter = None
        self.votes = set()

        # `_turn_id` invalidates stale timeout watchers once a turn resolves early
        # (word accepted/rejected before the clock ran out).
        self._turn_id = 0
        self._turn_timer_task = None
        self._vote_timer_task = None

        self.game_task = None

    # -------------------------------------------------------------------
    # Lifecycle
    # -------------------------------------------------------------------
    async def start(self) -> None:
        print("[SlangEngine] Triggering game start broadcast")
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
        await self._broadcast_seating_state()
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
        try:
            await self._all_confirmed_event.wait()
            self.round_number = 1
            self._start_new_round(first_round=True)
            await self._advance_to_next_turn()
        except asyncio.CancelledError:
            print("[SlangEngine] Game loop tracking thread was explicitly terminated.")

    async def end_game(self) -> None:
        self.phase = "game_over"
        self._cancel_turn_timer()
        self._cancel_vote_timer()
        await self.sio.emit("game_update", {"type": "END_GAME", "payload": {}}, room=self.room)

    # -------------------------------------------------------------------
    # Player-driven events
    # -------------------------------------------------------------------
    async def handle_event(self, username: str, event_type: str, data: Dict[str, Any]) -> Tuple[bool, str, Any, Any]:
        if username not in self.game_players:
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
            return False, f"Unrecognized engine instruction keyword: '{event_type}'.", {}, {}

    async def _handle_confirm_ready(self, username: str) -> Tuple[bool, str, Any, Any]:
        if self.phase != "seating":
            return False, "The game has already started.", None, None

        if username in self.confirmed:
            return True, f"{username} already confirmed.", {"confirmed": True}, None

        self.confirmed.add(username)
        broadcast = {"confirmed": sorted(self.confirmed), "total": len(self.turn_order)}

        if len(self.confirmed) == len(self.turn_order):
            self._all_confirmed_event.set()

        return True, f"{username} confirmed ready.", {"confirmed": True}, broadcast

    async def _handle_submit_word(self, username: str, data: Dict[str, Any]) -> Tuple[bool, str, Any, Any]:
        if self.phase != "turn":
            return False, "There's no active turn to submit a word for.", None, None
        if username != self.current_player():
            return False, "It's not your turn.", None, None
        if self.pending_word is not None:
            return False, "A bullsh*t vote is already in progress.", None, None

        word = str(data.get("word", "")).strip().lower()
        required_letter = self._current_required_letter()

        if len(word) < self.MIN_WORD_LENGTH:
            reason = f'must be at least {self.MIN_WORD_LENGTH} letters'
            return (
                True,
                "Word rejected: too short.",
                {"accepted": False, "reason": reason},
                {"word": word, "reason": reason},
            )

        if not word.startswith(required_letter):
            reason = f'must start with "{required_letter.upper()}"'
            return (
                True,
                "Word rejected: wrong starting letter.",
                {"accepted": False, "reason": reason},
                {"word": word, "reason": reason},
            )

        self._cancel_turn_timer()

        if word_bank.contains(word, self.CATEGORY):
            # Recognized word: instant accept, no vote — move straight to the next turn.
            self.chain.append(word)
            self.current_index = (self.current_index + 1) % len(self.turn_order)
            await self._advance_to_next_turn()
            return True, "Word accepted.", {"accepted": True}, {"word": word, "result": "accepted"}

        # Unrecognized word: open a bullsh*t vote.
        self.pending_word = word
        self.pending_submitter = username
        self.votes = set()
        self._vote_timer_task = asyncio.create_task(self._vote_timeout_watch(word, self._turn_id))
        await self._broadcast_turn_state()
        return (
            True,
            "Word submitted for a bullsh*t vote.",
            {"accepted": None, "pending_vote": True},
            {"word": word, "result": "pending_vote"},
        )

    async def _handle_vote_bullshit(self, username: str) -> Tuple[bool, str, Any, Any]:
        if self.phase != "turn" or self.pending_word is None:
            return False, "No word is currently up for a vote.", None, None
        if username == self.pending_submitter:
            return False, "You can't vote on your own word.", None, None
        if username in self.votes:
            return True, "Vote already cast.", {"voted": True}, None

        self.votes.add(username)
        votes_needed = self._votes_needed()
        broadcast = {"voteCount": len(self.votes), "votesNeeded": votes_needed}

        if len(self.votes) >= votes_needed:
            word = self.pending_word
            submitter = self.pending_submitter
            self.pending_word = None
            self.pending_submitter = None
            self._cancel_vote_timer()
            await self._lose_life(submitter, reason="bullshit_vote")
        else:
            await self._broadcast_turn_state()

        return True, "Vote recorded.", {"voted": True}, broadcast

    def _handle_chat_message(self, username: str, data: Dict[str, Any]) -> Tuple[bool, str, Any, Any]:
        text = str(data.get("text", "")).strip()
        if not text:
            return False, "Message can't be empty.", None, None
        return True, "Message sent.", {}, {"text": text}

    # -------------------------------------------------------------------
    # Turn / round progression
    # -------------------------------------------------------------------
    def current_player(self) -> str:
        return self.turn_order[self.current_index]

    def _current_required_letter(self) -> str:
        return self.chain[-1][-1] if self.chain else self.round_required_letter

    def _start_new_round(self, first_round: bool = False) -> None:
        self.chain = []
        eligible_letters = word_bank.letters_with_words(self.CATEGORY) or list(string.ascii_lowercase)
        self.round_required_letter = random.choice(eligible_letters)
        if first_round:
            self.current_index = random.randrange(len(self.turn_order))

    async def _advance_to_next_turn(self) -> None:
        self._turn_id += 1
        turn_id = self._turn_id
        self.turn_number += 1
        self.pending_word = None
        self.pending_submitter = None
        self.votes = set()
        self.phase = "turn"

        await self._broadcast_turn_state()
        self._turn_timer_task = asyncio.create_task(self._turn_timeout_watch(turn_id))

    async def _turn_timeout_watch(self, turn_id: int) -> None:
        try:
            await asyncio.sleep(self.TURN_SECONDS)
        except asyncio.CancelledError:
            return
        # Stale watcher: the turn already resolved (word accepted, or a vote opened).
        if turn_id != self._turn_id or self.pending_word is not None:
            return
        # Clear our own reference *before* calling _lose_life: that method calls
        # _cancel_turn_timer(), and since this coroutine IS self._turn_timer_task,
        # leaving the reference set would cancel this very task mid-execution and
        # silently abort everything after the "drinking" broadcast.
        self._turn_timer_task = None
        await self._lose_life(self.current_player(), reason="timeout")

    async def _vote_timeout_watch(self, word: str, turn_id: int) -> None:
        try:
            await asyncio.sleep(self.VOTE_SECONDS)
        except asyncio.CancelledError:
            return
        # Stale watcher: the vote already resolved (rejected, or turn moved on).
        if turn_id != self._turn_id or self.pending_word != word:
            return
        # Clear our own reference before proceeding — see _turn_timeout_watch for why.
        self._vote_timer_task = None
        # Vote failed to reach threshold in time — word stands. It's not a
        # recognized dictionary word, but a real player used it and nobody
        # successfully called bullsh*t on it, so it's worth a human's look
        # as a potential addition to the real word list.
        word_bank.add_candidate(word, added_by=self.pending_submitter)
        self.pending_word = None
        self.pending_submitter = None
        self.chain.append(word)
        self.current_index = (self.current_index + 1) % len(self.turn_order)
        await self._advance_to_next_turn()

    async def _lose_life(self, player_name: str, reason: str) -> None:
        player = self.game_players[player_name]
        fails_before = player.fails
        player.add_fail()
        fails_after = player.fails

        self.phase = "drinking"
        self._cancel_turn_timer()
        self._cancel_vote_timer()

        next_index = (self.turn_order.index(player_name) + 1) % len(self.turn_order)
        next_player = self.turn_order[next_index]
        chain_word = self.chain[-1] if self.chain else self.round_required_letter.upper()

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
        await asyncio.sleep(self.DRINKING_PAUSE_SECONDS)

        if fails_after >= self.STARTING_LIVES:
            player.eliminated = True
            await self._broadcast_blackout(player_name)
            await self.end_game()
            return

        self.current_index = next_index
        self.round_number += 1
        self._start_new_round()
        await self._advance_to_next_turn()

    async def _broadcast_blackout(self, eliminated_player: str) -> None:
        self.phase = "blackout"
        standings = sorted(
            ({"name": name, "fails": p.fails} for name, p in self.game_players.items()),
            key=lambda s: s["fails"],
        )
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
        return math.floor(eligible * self.VOTE_THRESHOLD_PERCENT / 100) + 1

    # -------------------------------------------------------------------
    # Broadcast helpers
    # -------------------------------------------------------------------
    async def _broadcast_seating_state(self) -> None:
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
        await self.sio.emit("game_update", {"type": "PHASE_CHANGE", "payload": payload}, room=self.room)

    def _cancel_turn_timer(self) -> None:
        if self._turn_timer_task is not None and not self._turn_timer_task.done():
            self._turn_timer_task.cancel()
        self._turn_timer_task = None

    def _cancel_vote_timer(self) -> None:
        if self._vote_timer_task is not None and not self._vote_timer_task.done():
            self._vote_timer_task.cancel()
        self._vote_timer_task = None
