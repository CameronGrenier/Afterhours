import asyncio
import sys
from pathlib import Path

import pytest


# from this folder.
REPO_ROOT = Path(__file__).resolve().parents[3]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from Games.Game1.GameEngine import slangengine as slangengine_module
from Games.Game1.GameEngine.slangengine import SlangEngine

class FakeSio:
    #Records every emit() instead of touching a real socket, so a test can assert 
    #that the right events were emitted.

    def __init__(self):
        self.emitted = []

    async def emit(self, event, payload, room=None):
        self.emitted.append({"event": event, "payload": payload, "room": room})

    def payloads_of_type(self, update_type):
        #pulls out just the payload dicts matching a given "type", e.g. "END_GAME"
        return [
            e["payload"]["payload"]
            for e in self.emitted
            if e["payload"].get("type") == update_type
        ]
@pytest.fixture
def fake_sio():
    return FakeSio()


@pytest.fixture
def engine(fake_sio):
    #test engine with two players, alice and bob, in a room called "test-room"
    players = ["alice", "bob"]
    return SlangEngine(players, fake_sio, room="test-room")

class FakeWordBank:
    #Swaps in for the real sqlite-backed word_bank so tests don't touch words.db
    #and can control exactly what counts as a "real" word.

    def __init__(self, recognized_words=None, letters=None):
        self.recognized_words = set(recognized_words or [])
        self.letters = list(letters or ["a", "b", "c", "d", "e"])
        self.candidates_added = []  # (word, added_by) pairs, for assertions

    def contains(self, word, category):
        return word in self.recognized_words

    def letters_with_words(self, category):
        return self.letters

    def add_candidate(self, word, added_by=None):
        self.candidates_added.append((word, added_by))


@pytest.fixture
def fake_word_bank(monkeypatch):
    #replaces the word_bank that slangengine.py already imported, so the
    #engine talks to the fake instead of the real sqlite database
    fwb = FakeWordBank()
    monkeypatch.setattr(slangengine_module, "word_bank", fwb)
    return fwb


@pytest.fixture
def fast_engine(monkeypatch, fake_sio, fake_word_bank):
    #shrinks the turn/vote/drinking timers down to almost nothing, so tests
    #that rely on a timeout firing don't actually sit around for 15 real seconds
    monkeypatch.setattr(SlangEngine, "TURN_SECONDS", 0.05)
    monkeypatch.setattr(SlangEngine, "VOTE_SECONDS", 0.05)
    monkeypatch.setattr(SlangEngine, "DRINKING_PAUSE_SECONDS", 0.01)

    def _build(players=("alice", "bob"), room="test-room"):
        return SlangEngine(list(players), fake_sio, room)

    return _build


async def confirm_all(engine, players):
    #helper: confirms every player ready and waits for the engine to reach the first turn
    for p in players:
        await engine.handle_event(p, "confirm_ready", {})
    await asyncio.wait_for(engine.game_task, timeout=1)