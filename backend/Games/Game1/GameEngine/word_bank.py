"""
word_bank.py

Backs the Slang! game engine with the real production MySQL schema
(cp476_afterhours: Terms, Categories, Term_Category, Logs_table).

How the candidate-review flow maps onto this schema:
  - A real, gameplay-valid word is a row in Terms, linked to a Categories
    row via Term_Category.
  - When a submitted word survives a bullsh*t vote by time running out
  it isn't automatically promoted into Terms/Term_Category. Instead,
    the engine calls add_candidate() to log it into Logs_table for later
    untill a developer reviews the code and deems it worthy of promotion into the 
    real schema. 

Usage:
    from Games.Game1.GameEngine.word_bank import word_bank
    word_bank.contains("yeet", "Slang Words")
"""

import csv
import os
import threading
from typing import List, Optional

import mysql.connector
from mysql.connector import errorcode


class WordBank:
    def __init__(
        self,
        host: str = None,
        user: str = None,
        password: str = None,
        database: str = None,
        port: int = None,
    ):
    
        self.host = host or os.getenv("MYSQL_HOST", "localhost")
        self.user = user or os.getenv("MYSQL_USER", "afterhours")
        self.password = password or os.getenv("MYSQL_PASSWORD", "afterhours_dev")
        self.database = database or os.getenv("MYSQL_DATABASE", "cp476_afterhours")
        self.port = port or int(os.getenv("MYSQL_PORT", "3306"))

        
        self._lock = threading.Lock()
        self._conn = mysql.connector.connect(
            host=self.host,
            user=self.user,
            password=self.password,
            database=self.database,
            port=self.port,
        )

    # ------------------------------------------------------------------
    # Setup / migration
    # ------------------------------------------------------------------
    def _get_or_create_category_id(self, cursor, category: str) -> int:
        cursor.execute("SELECT category_id FROM Categories WHERE category = %s", (category,))
        row = cursor.fetchone()
        if row is not None:
            return row[0]
        cursor.execute("INSERT INTO Categories (category) VALUES (%s)", (category,))
        return cursor.lastrowid

    def _get_or_create_term_id(self, cursor, word: str) -> int:
        # Terms.term has no UNIQUE constraint in the schema, so we have to
        # check for an existing row ourselves before inserting -- otherwise
        # re-running migrate_csv() would create duplicate Terms rows for
        # the same word every time.
        cursor.execute("SELECT term_id FROM Terms WHERE term = %s", (word,))
        row = cursor.fetchone()
        if row is not None:
            return row[0]
        cursor.execute("INSERT INTO Terms (term) VALUES (%s)", (word,))
        return cursor.lastrowid

    def migrate_csv(self, csv_path: str) -> int:
        """
        One-time / idempotent load of a (word, category) CSV. Safe to call
        repeatedly -- Term_Category's composite primary key means a
        duplicate (term_id, category_id) pair is simply skipped.
        Returns the number of new Term_Category links created.
        """
        inserted = 0
        with open(csv_path, "r", encoding="utf-8", newline="") as f:
            reader = csv.reader(f)
            with self._lock:
                cursor = self._conn.cursor()
                for row in reader:
                    if not row or len(row) < 2:
                        continue
                    word, category = row[0].strip().lower(), row[1].strip()
                    if not word or not category:
                        continue

                    category_id = self._get_or_create_category_id(cursor, category)
                    term_id = self._get_or_create_term_id(cursor, word)

                    cursor.execute(
                        "INSERT IGNORE INTO Term_Category (term_id, category_id) VALUES (%s, %s)",
                        (term_id, category_id),
                    )
                    if cursor.rowcount:
                        inserted += 1
                self._conn.commit()
                cursor.close()
        return inserted

    # ------------------------------------------------------------------
    # Gameplay-facing API (used by SlangEngine) -- same method signatures
    # as before, so slangengine.py needs zero changes.
    # ------------------------------------------------------------------
    def contains(self, word: str, category: str) -> bool:
        word = word.strip().lower()
        with self._lock:
            cursor = self._conn.cursor()
            cursor.execute(
                """
                SELECT 1 FROM Terms
                JOIN Term_Category ON Terms.term_id = Term_Category.term_id
                JOIN Categories ON Term_Category.category_id = Categories.category_id
                WHERE Terms.term = %s AND Categories.category = %s
                LIMIT 1
                """,
                (word, category),
            )
            result = cursor.fetchone()
            cursor.close()
            return result is not None

    def letters_with_words(self, category: str) -> List[str]:
        with self._lock:
            cursor = self._conn.cursor()
            cursor.execute(
                """
                SELECT DISTINCT LEFT(Terms.term, 1) FROM Terms
                JOIN Term_Category ON Terms.term_id = Term_Category.term_id
                JOIN Categories ON Term_Category.category_id = Categories.category_id
                WHERE Categories.category = %s
                """,
                (category,),
            )
            letters = [row[0] for row in cursor.fetchall() if row[0]]
            cursor.close()
            return letters

    def add_candidate(self, word: str, added_by: Optional[str] = None) -> None:
        """
        Logs a word that survived a bullsh*t vote for later human review.
        `added_by` is accepted for compatibility with slangengine.py's call
        site but intentionally ignored -- this schema doesn't track who
        submitted a word, only that one was submitted.
        """
        word = word.strip().lower()
        # Candidates are logged against a reserved "Candidates" category so
        # list_candidates()/promote_candidate() know where to look, without
        # needing a schema change.
        with self._lock:
            cursor = self._conn.cursor()
            category_id = self._get_or_create_category_id(cursor, "Candidates")
            cursor.execute(
                "INSERT INTO Logs_table (category_id, log) VALUES (%s, %s)",
                (category_id, word[:32]),  # log column is VARCHAR(32)
            )
            self._conn.commit()
            cursor.close()

    def list_candidates(self) -> List[dict]:
        """For a moderation screen: everything currently awaiting review."""
        with self._lock:
            cursor = self._conn.cursor()
            cursor.execute(
                """
                SELECT Logs_table.log_id, Logs_table.log
                FROM Logs_table
                JOIN Categories ON Logs_table.category_id = Categories.category_id
                WHERE Categories.category = 'Candidates'
                ORDER BY Logs_table.log_id ASC
                """
            )
            rows = cursor.fetchall()
            cursor.close()
            return [{"log_id": r[0], "word": r[1]} for r in rows]

    def promote_candidate(self, word: str, category: str) -> bool:
        """
        Human-moderator action: take a logged candidate word and turn it
        into a real Terms/Term_Category pairing. Returns True if a
        matching log entry was found and promoted, False otherwise.
        """
        word = word.strip().lower()[:32]
        with self._lock:
            cursor = self._conn.cursor()
            cursor.execute(
                """
                SELECT Logs_table.log_id FROM Logs_table
                JOIN Categories ON Logs_table.category_id = Categories.category_id
                WHERE Logs_table.log = %s AND Categories.category = 'Candidates'
                LIMIT 1
                """,
                (word,),
            )
            row = cursor.fetchone()
            if row is None:
                cursor.close()
                return False
            log_id = row[0]

            target_category_id = self._get_or_create_category_id(cursor, category)
            term_id = self._get_or_create_term_id(cursor, word)
            cursor.execute(
                "INSERT IGNORE INTO Term_Category (term_id, category_id) VALUES (%s, %s)",
                (term_id, target_category_id),
            )
            cursor.execute("DELETE FROM Logs_table WHERE log_id = %s", (log_id,))
            self._conn.commit()
            cursor.close()
            return True

    def reject_candidate(self, word: str) -> bool:
        """Human-moderator action: discard a logged candidate."""
        word = word.strip().lower()[:32]
        with self._lock:
            cursor = self._conn.cursor()
            cursor.execute(
                """
                DELETE FROM Logs_table WHERE log_id = (
                    SELECT log_id FROM (
                        SELECT Logs_table.log_id FROM Logs_table
                        JOIN Categories ON Logs_table.category_id = Categories.category_id
                        WHERE Logs_table.log = %s AND Categories.category = 'Candidates'
                        LIMIT 1
                    ) AS sub
                )
                """,
                (word,),
            )
            self._conn.commit()
            deleted = cursor.rowcount > 0
            cursor.close()
            return deleted


word_bank = WordBank()