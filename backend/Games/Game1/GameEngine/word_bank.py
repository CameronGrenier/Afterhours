"""
word_bank.py
Backs the Slang! game engine with a SQLite word database (see schema.sql).
Two kinds of rows live in `categories`:
  real gameplay categories (is_candidate_pool = 0), e.g. "Slang Words"
  exactly one candidate pool (is_candidate_pool = 1) that holds
    player-submitted words which survived a bullsh*t vote but haven't been
    reviewed by a the developers(us) yet. Candidate words are NOT valid for gameplay —
    contains() only ever matches real categories — until we call
    promote_candidate() to move one into a real category.
still needs a ui for moderation of the candidate pool, but the engine can already
add candidates and list them for review.
"""

import csv
import os
import sqlite3
import threading
from typing import List, Optional

_MODULE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB_PATH = os.path.join(_MODULE_DIR, "words.db")
DEFAULT_SCHEMA_PATH = os.path.join(_MODULE_DIR, "schema.sql")
DEFAULT_CSV_PATH = os.path.join(_MODULE_DIR, "slang_words.csv")

CANDIDATE_POOL_NAME = "Candidates"


class WordBank:
    def __init__(self, db_path: str = DEFAULT_DB_PATH, schema_path: str = DEFAULT_SCHEMA_PATH):
        self.db_path = db_path
        self.schema_path = schema_path
        # SQLite connections aren't safe to share across threads/event-loop
        # callbacks by default; the engine's handlers can fire from different
        # asyncio callbacks, so guard every DB touch with a lock rather than
        # trying to keep one connection pinned to one thread.
        self._lock = threading.Lock()
        self._conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self._conn.execute("PRAGMA foreign_keys = ON")
        self._init_schema()
        self._ensure_candidate_pool()

    #initial setup
    def _init_schema(self) -> None:
        with open(self.schema_path, "r", encoding="utf-8") as f:
            schema_sql = f.read()
        with self._lock:
            self._conn.executescript(schema_sql)
            self._conn.commit()

    def _ensure_candidate_pool(self) -> None:
        with self._lock:
            self._conn.execute(
                "INSERT OR IGNORE INTO categories (name, is_candidate_pool) VALUES (?, 1)",
                (CANDIDATE_POOL_NAME,),
            )
            self._conn.commit()

    def _get_or_create_category_id(self, category: str, is_candidate_pool: int = 0) -> int:
        cur = self._conn.execute("SELECT id FROM categories WHERE name = ?", (category,))
        row = cur.fetchone()
        if row is not None:
            return row[0]
        cur = self._conn.execute(
            "INSERT INTO categories (name, is_candidate_pool) VALUES (?, ?)",
            (category, is_candidate_pool),
        )
        self._conn.commit()
        return cur.lastrowid

    def migrate_csv(self, csv_path: str = DEFAULT_CSV_PATH, added_by: Optional[str] = None) -> int:
        """
        One-time / idempotent load of a (word, category) CSV into the
        database. Safe to call repeatedly — duplicate (word, category)
        pairs are silently skipped via the UNIQUE constraint.
        Returns the number of new rows inserted.
        """
        inserted = 0
        with open(csv_path, "r", encoding="utf-8", newline="") as f:
            reader = csv.reader(f)
            with self._lock:
                for row in reader:
                    if not row or len(row) < 2:
                        continue
                    word, category = row[0].strip().lower(), row[1].strip()
                    if not word or not category:
                        continue
                    category_id = self._get_or_create_category_id(category, is_candidate_pool=0)
                    cur = self._conn.execute(
                        "INSERT OR IGNORE INTO words (word, category_id, added_by) VALUES (?, ?, ?)",
                        (word, category_id, added_by),
                    )
                    if cur.rowcount:
                        inserted += 1
                self._conn.commit()
        return inserted

    #to be used by slangengine.py to check if a word is in the database for a given category
    def contains(self, word: str, category: str) -> bool:
        """True only for words in a REAL category — never matches candidates."""
        word = word.strip().lower()
        with self._lock:
            cur = self._conn.execute(
                """
                SELECT 1 FROM words
                JOIN categories ON words.category_id = categories.id
                WHERE words.word = ?
                  AND categories.name = ?
                  AND categories.is_candidate_pool = 0
                LIMIT 1
                """,
                (word, category),
            )
            return cur.fetchone() is not None

    def letters_with_words(self, category: str) -> List[str]:
        """Distinct starting letters available in a real category, for
        picking a valid `round_required_letter`."""
        with self._lock:
            cur = self._conn.execute(
                """
                SELECT DISTINCT substr(words.word, 1, 1) FROM words
                JOIN categories ON words.category_id = categories.id
                WHERE categories.name = ? AND categories.is_candidate_pool = 0
                """,
                (category,),
            )
            return [row[0] for row in cur.fetchall() if row[0]]

    def add_candidate(self, word: str, added_by: Optional[str] = None) -> None:
        """Drop a player-submitted, vote-surviving word into the candidate
        pool for later human review. Does nothing if it's already sitting
        in the candidate pool."""
        word = word.strip().lower()
        with self._lock:
            candidate_id = self._get_or_create_category_id(CANDIDATE_POOL_NAME, is_candidate_pool=1)
            self._conn.execute(
                "INSERT OR IGNORE INTO words (word, category_id, added_by) VALUES (?, ?, ?)",
                (word, candidate_id, added_by),
            )
            self._conn.commit()

    def list_candidates(self) -> List[dict]:
        """For a moderation screen: everything currently awaiting review."""
        with self._lock:
            cur = self._conn.execute(
                """
                SELECT words.id, words.word, words.added_by, words.created_at
                FROM words
                JOIN categories ON words.category_id = categories.id
                WHERE categories.is_candidate_pool = 1
                ORDER BY words.created_at ASC
                """
            )
            return [
                {"id": r[0], "word": r[1], "added_by": r[2], "created_at": r[3]}
                for r in cur.fetchall()
            ]

    def promote_candidate(self, word: str, category: str) -> bool:
        """
        Human-moderator action: move a word out of the candidate pool and
        into a real gameplay category. Returns True if a candidate row was
        found and promoted, False if that word wasn't pending review.
        """
        word = word.strip().lower()
        with self._lock:
            cur = self._conn.execute(
                """
                SELECT words.id, words.added_by FROM words
                JOIN categories ON words.category_id = categories.id
                WHERE words.word = ? AND categories.is_candidate_pool = 1
                LIMIT 1
                """,
                (word,),
            )
            row = cur.fetchone()
            if row is None:
                return False
            word_id, added_by = row
            target_category_id = self._get_or_create_category_id(category, is_candidate_pool=0)

            # Move it: delete the candidate-pool row, insert into the real
            # category (rather than UPDATE) so the UNIQUE(word, category_id)
            # constraint still protects against dupes if it's already there.
            self._conn.execute("DELETE FROM words WHERE id = ?", (word_id,))
            self._conn.execute(
                "INSERT OR IGNORE INTO words (word, category_id, added_by) VALUES (?, ?, ?)",
                (word, target_category_id, added_by),
            )
            self._conn.commit()
            return True

    def reject_candidate(self, word: str) -> bool:
        """Human-moderator action: discard a candidate instead of promoting it."""
        word = word.strip().lower()
        with self._lock:
            cur = self._conn.execute(
                """
                DELETE FROM words WHERE id = (
                    SELECT words.id FROM words
                    JOIN categories ON words.category_id = categories.id
                    WHERE words.word = ? AND categories.is_candidate_pool = 1
                    LIMIT 1
                )
                """,
                (word,),
            )
            self._conn.commit()
            return cur.rowcount > 0



word_bank = WordBank()
if os.path.exists(DEFAULT_CSV_PATH):
    word_bank.migrate_csv()