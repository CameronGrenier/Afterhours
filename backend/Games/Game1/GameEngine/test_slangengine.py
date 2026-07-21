import asyncio

import pytest

from conftest import confirm_all, real_word_starting_with

pytestmark = pytest.mark.asyncio


# Seating / start


async def test_all_players_confirming_starts_first_turn(fast_engine):
    engine = fast_engine(players=["player1", "player2"])
    await engine.start()

    await confirm_all(engine, ["player1", "player2"])

    assert engine.phase == "turn"
    assert engine.current_player() in ("player1", "player2")
    assert engine.round_required_letter is not None


async def test_confirm_ready_is_idempotent_per_player(fast_engine):
    engine = fast_engine(players=["player1", "player2"])
    await engine.start()

    ok1, msg1, *_ = await engine.handle_event("player1", "confirm_ready", {})
    ok2, msg2, *_ = await engine.handle_event("player1", "confirm_ready", {})

    assert ok1 and ok2
    assert "already confirmed" in msg2
    assert engine.phase == "seating"  # player2 never confirmed


async def test_unknown_username_is_rejected(fast_engine):
    engine = fast_engine(players=["player1", "player2"])
    await engine.start()

    ok, msg, *_ = await engine.handle_event("mallory", "confirm_ready", {})

    assert ok is False
    assert "not associated" in msg.lower()


# Word submission: validation


async def test_word_too_short_is_rejected_without_ending_turn(fast_engine):
    engine = fast_engine(players=["player1", "player2"])
    await engine.start()
    await confirm_all(engine, ["player1", "player2"])

    current = engine.current_player()
    ok, msg, result, _ = await engine.handle_event(current, "submit_word", {"word": "hi"})

    assert ok is True
    assert result["accepted"] is False
    assert "3" in result["reason"] or "least" in result["reason"]
    assert engine.phase == "turn"
    assert engine.current_player() == current  # turn didn't advance


async def test_word_with_wrong_starting_letter_is_rejected(fast_engine):
    engine = fast_engine(players=["player1", "player2"])
    await engine.start()
    await confirm_all(engine, ["player1", "player2"])

    required = engine.round_required_letter
    wrong_letter = "z" if required != "z" else "y"
    current = engine.current_player()

    ok, msg, result, _ = await engine.handle_event(
        current, "submit_word", {"word": wrong_letter + "og"}
    )

    assert ok is True
    assert result["accepted"] is False
    assert required.upper() in result["reason"]


async def test_only_current_player_can_submit(fast_engine):
    engine = fast_engine(players=["player1", "player2"])
    await engine.start()
    await confirm_all(engine, ["player1", "player2"])

    current = engine.current_player()
    other = "player2" if current == "player1" else "player1"

    ok, msg, *_ = await engine.handle_event(other, "submit_word", {"word": "cat"})

    assert ok is False
    assert "not your turn" in msg.lower()


# Word submission: recognized word -> instant accept


async def test_recognized_word_is_accepted_and_advances_turn(fast_engine):
    engine = fast_engine(players=["player1", "player2"])
    await engine.start()
    await confirm_all(engine, ["player1", "player2"])

    required = engine.round_required_letter
    word = real_word_starting_with(required)
    assert word is not None, f"no real word in the database starts with '{required}'"
    current = engine.current_player()

    ok, msg, result, broadcast = await engine.handle_event(
        current, "submit_word", {"word": word}
    )

    assert result["accepted"] is True
    assert engine.chain == [word]
    assert engine.current_player() != current  # advanced to next player
    assert engine._current_required_letter() == word[-1]


# Word submission: unrecognized word -> bullsh*t vote


async def test_unrecognized_word_opens_a_vote(fast_engine):
    engine = fast_engine(players=["player1", "player2", "carol"])
    await engine.start()
    await confirm_all(engine, ["player1", "player2", "carol"])

    required = engine.round_required_letter
    word = required + "xyz"  # deliberately not a real word in the database
    current = engine.current_player()

    ok, msg, result, _ = await engine.handle_event(current, "submit_word", {"word": word})

    assert result["pending_vote"] is True
    assert engine.pending_word == word
    assert engine.pending_submitter == current


async def test_vote_reaching_threshold_costs_submitter_a_life(fast_engine):
    engine = fast_engine(players=["player1", "player2", "carol"])
    await engine.start()
    await confirm_all(engine, ["player1", "player2", "carol"])

    required = engine.round_required_letter
    word = required + "xyz"
    submitter = engine.current_player()
    voters = [p for p in engine.turn_order if p != submitter]

    await engine.handle_event(submitter, "submit_word", {"word": word})
    # VOTE_THRESHOLD_PERCENT=40 of 2 eligible voters -> floor(0.8)+1 = 1 vote needed
    await engine.handle_event(voters[0], "vote_bullshit", {})

    await asyncio.sleep(0.1)  # let the drinking-pause sleep inside _lose_life elapse

    player = engine.game_players[submitter]
    assert player.fails == 1
    assert engine.pending_word is None
    assert word not in engine.chain  # rejected word never joins the chain


async def test_vote_timeout_lets_word_stand_as_candidate(fast_engine):
    from Games.Game1.GameEngine.word_bank import word_bank

    engine = fast_engine(players=["player1", "player2"])
    await engine.start()
    await confirm_all(engine, ["player1", "player2"])

    required = engine.round_required_letter
    word = required + "xyz"
    submitter = engine.current_player()

    await engine.handle_event(submitter, "submit_word", {"word": word})
    # Once the vote times out, the engine immediately starts a *new* turn
    # timer. Pin it way up so that timer can't also fire mid-assertion and
    # cascade into a second timeout that resets the chain out from under us.
    engine.TURN_SECONDS = 999
    # nobody votes; wait past VOTE_SECONDS (0.05s in this fixture)
    await asyncio.sleep(0.2)

    cursor = word_bank._conn.cursor()
    cursor.execute(
        """
        SELECT Categories.category FROM Logs_table
        JOIN Categories ON Logs_table.category_id = Categories.category_id
        WHERE Logs_table.log = %s
        """,
        (word,),
    )
    row = cursor.fetchone()
    cursor.close()
    assert row is not None, f"'{word}' was not written to Logs_table"
    assert row[0] == "Candidates"

    assert word in engine.chain
    assert engine.pending_word is None
    assert engine.game_players[submitter].fails == 0  # word stood, no life lost


async def test_voter_cannot_vote_twice(fast_engine):
    engine = fast_engine(players=["player1", "player2", "carol", "dave"])
    await engine.start()
    await confirm_all(engine, ["player1", "player2", "carol", "dave"])

    required = engine.round_required_letter
    word = required + "xyz"
    submitter = engine.current_player()
    voter = [p for p in engine.turn_order if p != submitter][0]

    await engine.handle_event(submitter, "submit_word", {"word": word})
    await engine.handle_event(voter, "vote_bullshit", {})
    ok, msg, result, _ = await engine.handle_event(voter, "vote_bullshit", {})

    assert result["voted"] is True
    assert len(engine.votes) == 1  # second vote from same person didn't count again


# Turn timeout

async def test_turn_timeout_costs_current_player_a_life(fast_engine):
    engine = fast_engine(players=["player1", "player2"])
    await engine.start()
    await confirm_all(engine, ["player1", "player2"])

    current = engine.current_player()
    # Don't submit anything; wait just past TURN_SECONDS + the drinking
    # pause for exactly one timeout cycle. A generous sleep here would let
    # a *second* player's turn also time out and inflate the fail count.
    await asyncio.sleep(engine.TURN_SECONDS + engine.DRINKING_PAUSE_SECONDS + 0.03)

    assert engine.game_players[current].fails == 1
    assert engine.phase == "turn"  # game continued into the next turn

# Elimination / game over


async def test_player_eliminated_after_starting_lives_lost(fast_engine, fake_sio):
    engine = fast_engine(players=["player1", "player2"])
    await engine.start()
    await confirm_all(engine, ["player1", "player2"])

    # Nobody ever submits a word, so every turn times out. With two players
    # the loser alternates each time (loser -> next player's turn), so it
    # takes up to 2*STARTING_LIVES - 1 timeouts for someone to be
    # eliminated. Wait out enough turn+drinking cycles for that to play
    # out fully, then check the end state rather than the exact path.
    cycles_needed = 2 * engine.STARTING_LIVES
    cycle_time = engine.TURN_SECONDS + engine.DRINKING_PAUSE_SECONDS
    await asyncio.sleep(cycles_needed * cycle_time * 3)  # generous margin

    assert engine.phase == "game_over"
    eliminated = [p for p in engine.game_players.values() if p.eliminated]
    assert len(eliminated) == 1
    assert eliminated[0].fails >= engine.STARTING_LIVES

    end_game_events = fake_sio.payloads_of_type("END_GAME")
    phase_change_events = fake_sio.payloads_of_type("PHASE_CHANGE")
    assert len(end_game_events) == 1
    assert any(p.get("phase") == "blackout" for p in phase_change_events)