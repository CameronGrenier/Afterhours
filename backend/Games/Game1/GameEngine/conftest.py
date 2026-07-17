import sys
from pathlib import Path

import pytest

# Make "Games.Game1.GameEngine.slangengine" importable when running pytest
# from this folder.
REPO_ROOT = Path(__file__).resolve().parents[3]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from Games.Game1.GameEngine.slangengine import SlangEngine


class FakeSio:
    #Records every emit() instead of touching a real socket, so a test can assert 
    #that the right events were emitted.

    def __init__(self):
        self.emitted = []

    async def emit(self, event, payload, room=None):
        self.emitted.append({"event": event, "payload": payload, "room": room})


@pytest.fixture
def fake_sio():
    return FakeSio()


@pytest.fixture
def engine(fake_sio):
    ##test engine with two players, alice and bob, in a room called "test-room"
    players = ["alice", "bob"]
    return SlangEngine(players, fake_sio, room="test-room")