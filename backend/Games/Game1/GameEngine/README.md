# Slang! — Backend

Everything in `Games/Game1/GameEngine/` that makes up the Slang! game:
the engine itself, its MySQL-backed word database, and the tools to
test and playtest it. This document covers Slang only — not the rest
of the Afterhours app.

---

## What each file is for

| File | Purpose |
|---|---|
| `slangengine.py` | The actual game engine — turn order, word validation, bullsh*t votes, timeouts, elimination. This is what `GameRoom.py` instantiates when a room starts a Slang game. |
| `playerclass.py` | `SlangPlayer` — tracks one player's name, fail count, and elimination status within a game. |
| `word_bank.py` | Talks to the real MySQL database. Everything the engine needs to know about words — is it real, what letters are available, logging candidates for review — goes through this file. |
| `schema.sql` | The 4 `CREATE TABLE` statements that define the database structure. Run this once against a fresh MySQL database to set it up. |
| `slang_words.csv` | The starter word list (word, category) pairs. Gets loaded into MySQL automatically the first time `word_bank.py` is imported. |
| `conftest.py` | Shared test setup — fake socket connections, sped-up timers, and a helper that keeps tests from leaving junk data in your real database. Not a test file itself; pytest loads it automatically. |
| `test_slangengine.py` | Automated tests for the game logic itself — 13 tests covering turns, voting, timeouts, elimination. |
| `test_word_bank.py` | Automated tests for the database layer specifically — 10 tests covering migration, word lookup, candidate logging, promotion, and rejection. |
| `play_cli.py` | Lets a human actually play a real game from the terminal — type words, vote, watch turns advance. Uses real 15-second timers, unlike the test suite. |

---

## One-time setup

**1. Install and start MySQL locally:**
```bash
brew install mysql
brew services start mysql
```

**2. Create the database and a dedicated app user:**
```bash
mysql -u root
```
Then at the `mysql>` prompt:
```sql
CREATE DATABASE cp476_afterhours;
CREATE USER 'afterhours'@'localhost' IDENTIFIED BY 'afterhours_dev';
GRANT ALL PRIVILEGES ON cp476_afterhours.* TO 'afterhours'@'localhost';
FLUSH PRIVILEGES;
exit
```

**3. Run the schema against it** (from inside `Games/Game1/GameEngine/`):
```bash
mysql -u root cp476_afterhours < schema.sql
```

**4. Install Python dependencies:**
```bash
pip install mysql-connector-python pytest pytest-asyncio --break-system-packages
```

`word_bank.py` connects using these environment variables, defaulting
to what was just set up above — you only need to `export` these if
your credentials differ:
```
MYSQL_HOST=localhost
MYSQL_USER=afterhours
MYSQL_PASSWORD=afterhours_dev
MYSQL_DATABASE=cp476_afterhours
MYSQL_PORT=3306
```

---

## Running the tests

From inside `Games/Game1/GameEngine/`, with MySQL running:
```bash
pytest test_slangengine.py test_word_bank.py -v
```
Expect `23 passed`. Both files can also be run separately if you only
want one or the other.

---

## Playtesting (actually playing a game)

```bash
python3 play_cli.py
```
Enter player names when prompted, then take turns typing words as
whichever player is currently up. `quit` at any prompt exits cleanly.

Unlike the test suite, this uses the **real** 15-second turn/vote
timers — sitting on a prompt too long costs a life, same as it would
for a real laggy player. If you want to speed this up while manually
testing, temporarily lower `TURN_SECONDS`/`VOTE_SECONDS` at the top of
`slangengine.py` and change them back before committing.

### What to try
- **A recognized word** (e.g. `yeet`, `rizz`) → instantly accepted, no vote.
- **A made-up word** → opens a bullsh*t vote for the other players.
  - If the vote passes (enough "bullsh*t" votes) → the submitter loses
    a life, the word is discarded.
  - If the vote times out without enough votes → the word stands, and
    gets logged for human review (see `Logs_table` below).
- **Letting a turn's clock run out** → costs the current player a life.
- **Losing 3 lives** → that player is eliminated and the game ends.

---

## The database: 4 tables, what each one is actually for

The schema was designed by the team for production MySQL — `Terms`
and `Categories` are linked many-to-many through `Term_Category`,
rather than a word belonging to exactly one category.

```sql
CREATE TABLE IF NOT EXISTS cp476_afterhours.Terms (
term_id INT AUTO_INCREMENT PRIMARY KEY,
term VARCHAR(100) NOT NULL
);
CREATE TABLE IF NOT EXISTS cp476_afterhours.Categories (
category_id INT AUTO_INCREMENT PRIMARY KEY,
category VARCHAR(100) NOT NULL
);
CREATE TABLE IF NOT EXISTS cp476_afterhours.Term_Category (
term_id INT,
category_id INT,
PRIMARY KEY (term_id, category_id),
FOREIGN KEY (term_id) REFERENCES Terms(term_id),
FOREIGN KEY (category_id) REFERENCES Categories(category_id)
);
CREATE TABLE IF NOT EXISTS cp476_afterhours.Logs_table (
log_id INT AUTO_INCREMENT PRIMARY KEY,
category_id INT,
log VARCHAR(32) NOT NULL,
FOREIGN KEY (category_id) REFERENCES Categories(category_id)
);
```

**`Terms`** — every real, gameplay-valid word lives here as its own
row (`rizz`, `yeet`, etc.). Just the word text and its ID — no
category information on this table directly, since a term can belong
to more than one category.

**`Categories`** — the categories words can belong to. In this
project that's currently `"Slang Words"` (the real gameplay category)
plus one reserved row, `"Candidates"`, which doesn't hold real
gameplay words at all — it's a marker used to organize the review
queue in `Logs_table`.

**`Term_Category`** — the junction table connecting the two. A word
only counts as valid for a given category once a row exists here
linking its `term_id` to that category's `category_id`. This is
exactly what `word_bank.contains(word, category)` checks — it's a
`JOIN` across all three tables, not a lookup on `Terms` alone.

**`Logs_table`** — the candidate review queue. When a submitted word
survives a bullsh*t vote by running out the clock, it is **not**
immediately written into `Terms`/`Term_Category` — it's just logged
here as raw text (`log`, capped at 32 characters) tagged against the
`"Candidates"` category. It stays here, not valid for gameplay, until
a human moderator calls `word_bank.promote_candidate(word, category)`,
which is the moment it actually gets written into `Terms` and linked
via `Term_Category`. Calling `reject_candidate(word)` instead just
deletes the log entry — nothing was ever added to `Terms`, so there's
nothing to undo there.

This design was a deliberate simplification: the schema has no column
to record *who* submitted a candidate word, only that one was
submitted — `word_bank.add_candidate()` still accepts an `added_by`
argument for compatibility with how the engine calls it, but the
value is intentionally discarded.

### Manually reviewing candidates

There's no UI for this yet — it's done directly through `word_bank.py`:
```bash
python3 -c "from word_bank import word_bank; print(word_bank.list_candidates())"
python3 -c "from word_bank import word_bank; print(word_bank.promote_candidate('someword', 'Slang Words'))"
python3 -c "from word_bank import word_bank; print(word_bank.reject_candidate('someword'))"
```