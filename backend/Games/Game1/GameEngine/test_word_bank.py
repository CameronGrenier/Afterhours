"""
test_word_bank.py

Tests the REAL word_bank singleton against your REAL MySQL database
(cp476_afterhours). No fakes, no temp database. The autouse
clean_up_words_added_during_test fixture in conftest.py deletes anything a
test adds afterward, so repeated runs don't leave junk rows piling up.
"""

from Games.Game1.GameEngine.word_bank import word_bank


# ---------------------------------------------------------------------
# migrate_csv: safe to call repeatedly without duplicating anything
# ---------------------------------------------------------------------

def test_migrate_csv_is_safe_to_rerun_without_duplicating():
    cursor = word_bank._conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM Term_Category")
    before = cursor.fetchone()[0]
    cursor.close()

    inserted = word_bank.migrate_csv("slang_words.csv")

    cursor = word_bank._conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM Term_Category")
    after = cursor.fetchone()[0]
    cursor.close()

    assert inserted == 0  # already loaded once, nothing new
    assert after == before


# ---------------------------------------------------------------------
# contains(): checks against the real, already-populated database
# ---------------------------------------------------------------------

def test_recognized_word_is_actually_in_the_database():
    cursor = word_bank._conn.cursor()
    cursor.execute(
        """
        SELECT Terms.term FROM Terms
        JOIN Term_Category ON Terms.term_id = Term_Category.term_id
        JOIN Categories ON Term_Category.category_id = Categories.category_id
        WHERE Categories.category = 'Slang Words'
        LIMIT 1
        """
    )
    any_word = cursor.fetchone()[0]
    cursor.close()

    assert word_bank.contains(any_word, "Slang Words") is True


def test_made_up_word_is_not_in_the_database():
    assert word_bank.contains("zzznotarealword", "Slang Words") is False


# ---------------------------------------------------------------------
# add_candidate(): does it really write to Logs_table?
# ---------------------------------------------------------------------

def test_add_candidate_actually_persists():
    word_bank.add_candidate("babberflonk")

    cursor = word_bank._conn.cursor()
    cursor.execute(
        """
        SELECT Logs_table.log, Categories.category
        FROM Logs_table JOIN Categories ON Logs_table.category_id = Categories.category_id
        WHERE Logs_table.log = %s
        """,
        ("babberflonk",),
    )
    row = cursor.fetchone()
    cursor.close()

    assert row is not None
    assert row[0] == "babberflonk"
    assert row[1] == "Candidates"


def test_candidate_word_is_not_gameplay_valid_until_promoted():
    word_bank.add_candidate("babberflonk")
    assert word_bank.contains("babberflonk", "Slang Words") is False


def test_list_candidates_shows_pending_review_words():
    word_bank.add_candidate("babberflonk")
    word_bank.add_candidate("yeetdrizzle")

    pending = word_bank.list_candidates()
    words = {c["word"] for c in pending}
    assert {"babberflonk", "yeetdrizzle"} <= words


# ---------------------------------------------------------------------
# promote_candidate(): does it actually move the word into Terms/Term_Category?
# ---------------------------------------------------------------------

def test_promote_candidate_moves_word_into_real_category():
    word_bank.add_candidate("babberflonk")

    promoted = word_bank.promote_candidate("babberflonk", "Slang Words")
    assert promoted is True

    # Now valid for gameplay:
    assert word_bank.contains("babberflonk", "Slang Words") is True

    # And gone from the candidate log:
    cursor = word_bank._conn.cursor()
    cursor.execute("SELECT 1 FROM Logs_table WHERE log = %s", ("babberflonk",))
    still_logged = cursor.fetchone()
    cursor.close()
    assert still_logged is None


def test_promoting_a_word_that_was_never_a_candidate_fails_cleanly():
    promoted = word_bank.promote_candidate("neverexisted", "Slang Words")
    assert promoted is False


# reject_candidate(): does it actually delete the log row?

def test_reject_candidate_removes_it_entirely():
    word_bank.add_candidate("babberflonk")

    rejected = word_bank.reject_candidate("babberflonk")
    assert rejected is True

    cursor = word_bank._conn.cursor()
    cursor.execute("SELECT 1 FROM Logs_table WHERE log = %s", ("babberflonk",))
    row = cursor.fetchone()
    cursor.close()
    assert row is None


# letters_with_words(): does it reflect what's actually in the database?

def test_letters_with_words_matches_real_data():
    letters = word_bank.letters_with_words("Slang Words")

    cursor = word_bank._conn.cursor()
    cursor.execute(
        """
        SELECT DISTINCT LEFT(Terms.term, 1) FROM Terms
        JOIN Term_Category ON Terms.term_id = Term_Category.term_id
        JOIN Categories ON Term_Category.category_id = Categories.category_id
        WHERE Categories.category = 'Slang Words'
        """
    )
    real_letters = {row[0] for row in cursor.fetchall()}
    cursor.close()

    assert set(letters) == real_letters