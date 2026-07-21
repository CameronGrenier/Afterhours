import asyncio
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[3]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from Games.Game1.GameEngine.slangengine import SlangEngine
from Games.Game1.GameEngine.word_bank import word_bank


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
def fast_engine(monkeypatch, fake_sio):
    #shrinks the turn/vote/drinking timers down to almost nothing, so tests
    #that rely on a timeout firing don't actually sit around for 15 real seconds
    monkeypatch.setattr(SlangEngine, "TURN_SECONDS", 0.05)
    monkeypatch.setattr(SlangEngine, "VOTE_SECONDS", 0.05)
    monkeypatch.setattr(SlangEngine, "DRINKING_PAUSE_SECONDS", 0.01)

    def _build(players=("player1", "player2"), room="test-room"):
        return SlangEngine(list(players), fake_sio, room)

    return _build

@pytest.fixture(autouse=True)
def clean_up_words_added_during_test():
    cursor = word_bank._conn.cursor()
    cursor.execute("SELECT COALESCE(MAX(term_id), 0) FROM Terms")
    before_max_term_id = cursor.fetchone()[0]
    cursor.execute("SELECT COALESCE(MAX(log_id), 0) FROM Logs_table")
    before_max_log_id = cursor.fetchone()[0]
    cursor.close()
 
    yield
 
    cursor = word_bank._conn.cursor()
    cursor.execute("DELETE FROM Term_Category WHERE term_id > %s", (before_max_term_id,))
    cursor.execute("DELETE FROM Terms WHERE term_id > %s", (before_max_term_id,))
    cursor.execute("DELETE FROM Logs_table WHERE log_id > %s", (before_max_log_id,))
    word_bank._conn.commit()
    cursor.close()
 
 
def real_word_starting_with(letter):
    cursor = word_bank._conn.cursor()
    cursor.execute("SELECT term FROM Terms WHERE term LIKE %s LIMIT 1", (letter + "%",))
    row = cursor.fetchone()
    cursor.close()
    return row[0] if row else None


async def confirm_all(engine, players):
    #helper: confirms every player ready and waits for the engine to reach the first turn
    for p in players:
        await engine.handle_event(p, "confirm_ready", {})
    await asyncio.wait_for(engine.game_task, timeout=1)