# Slang! Backend

Everything in `Games/Game1/GameEngine/` that makes up the Slang! game: the engine itself, its MySQL-backed word database, and the tools to test and playtest it. This document covers Slang only, not the rest of the Afterhours app.

There are two ways to run this. Docker (recommended) brings up the whole stack (database, backend, and frontend) with one command and no manual MySQL setup. Manual setup is for working directly on the game engine in isolation, running the test suite, or playtesting from the terminal.

---

## What each file is for

| File | Purpose |
|---|---|
| `slangengine.py` | The actual game engine: turn order, word validation, bullsh\*t votes, timeouts, elimination. This is what `GameRoom.py` instantiates when a room starts a Slang game. |
| `playerclass.py` | `SlangPlayer`, which tracks one player's name, fail count, and elimination status within a game. |
| `word_bank.py` | Talks to the real MySQL database. Everything the engine needs to know about words (is it real, what letters are available, logging candidates for review) goes through this file. |
| `slang_words.csv` | The starter word list of (word, category) pairs. Under Docker it is loaded automatically; for manual setup it is loaded by running `migrate_csv()`. |
| `db/01_schema.sql` | The `CREATE TABLE` statements that define the database structure. Auto-run by the MySQL container on first boot. |
| `db/02_words.sql` | The starter word list as idempotent `INSERT` statements, generated from `slang_words.csv`. Auto-run by the MySQL container on first boot, right after the schema. |
| `conftest.py` | Shared test setup: fake socket connections, sped-up timers, and the test database configuration. Not a test file itself; pytest loads it automatically. |
| `test_slangengine.py` | Automated tests for the game logic itself. 13 tests covering turns, voting, timeouts, elimination. |
| `test_word_bank.py` | Automated tests for the database layer specifically. 10 tests covering migration, word lookup, candidate logging, promotion, and rejection. |
| `play_cli.py` | Lets a human actually play a real game from the terminal: type words, vote, watch turns advance. Uses real 15-second timers, unlike the test suite. |

---

## Running with Docker (recommended)

This is the fastest way to get the full stack running locally, and the intended path for anyone who just wants to run or evaluate the app rather than develop the engine.

### Prerequisites

Docker Desktop, installed and running. On Windows it uses the WSL 2 backend, which its installer sets up for you. Launch Docker Desktop and wait for the whale icon in the system tray to go steady before running any commands. If the engine isn't running, every `docker` command fails with a "cannot find the file specified" pipe error.

That's the only prerequisite. You do not need to install MySQL, Python, or Node locally to run the stack this way.

### Start everything

From the project root (the folder containing `docker-compose.yml`):

```
docker compose up --build
```

On first run this pulls the MySQL and Node images, builds the backend and frontend images, and starts three containers in order:

1. **db** is MySQL 8.4. On its very first boot it creates the `cp476_afterhours` database and the `afterhours` user, then runs `db/01_schema.sql` (the four tables) followed by `db/02_words.sql` (the starter word list). No manual SQL required.
2. **backend** is FastAPI + Socket.IO on port 8000. It waits for the database to report healthy before starting, so there is no startup race.
3. **frontend** is the Vite dev server on port 5173.

When it's up you'll see the db report `Healthy`, then `Uvicorn running on http://0.0.0.0:8000`, then the Vite startup banner.

Open the app at:

```
http://localhost:5173
```

The frontend talks to the backend at `http://localhost:8000`, configured via `VITE_API_URL` in the frontend's `.env.development`.

### Stopping

`Ctrl+C` in the terminal stops the containers. To also remove them and the network:

```
docker compose down
```

### Resetting the database

The database is initialized only on first boot, when its data directory is empty. The schema and word-list files are not re-run on later starts. If you change `db/01_schema.sql` or `db/02_words.sql` and want them to take effect, wipe the volume so the container re-initializes from scratch:

```
docker compose down -v
docker compose up --build
```

The `-v` clears the MySQL data. Without it, the init scripts are considered already done and your changes won't apply.

### Loading the word list manually (optional)

The word list is loaded automatically from `db/02_words.sql`. If you ever need to reload it from the CSV instead, for example after adding words to `slang_words.csv` without regenerating the SQL, run `migrate_csv()` inside the running backend container:

```
docker compose exec backend python -c "from Games.Game1.GameEngine.word_bank import word_bank; print(word_bank.migrate_csv('Games/Game1/GameEngine/slang_words.csv'))"
```

It prints the number of new word/category links created, and is idempotent, so re-running prints `0`.

### Troubleshooting Docker

**`cannot find the file specified` / `dockerDesktopLinuxEngine`.** Docker Desktop isn't running. Launch it and wait for the whale icon to settle, then retry.

**`Can't initialize batch_readline - may be the input source is a directory`.** A bind-mounted SQL file path in `docker-compose.yml` doesn't point at a real file, so Docker created an empty directory there instead. Confirm `db/01_schema.sql` and `db/02_words.sql` exist at the path the compose file expects, then run `docker compose down -v` and bring it back up.

**Backend exits with `2003 (HY000): Can't connect to MySQL server on 'db:3306'`.** The backend started before MySQL was ready. This is prevented by the db healthcheck and the backend's `depends_on: condition: service_healthy`. If you see it, confirm both are present in `docker-compose.yml`.

**Frontend loads but can't reach the backend.** Check that `VITE_API_URL` is `http://localhost:8000` and not `backend:8000`, since the browser resolves the URL on the host rather than inside Docker's network, and check that the backend service still publishes `8000:8000`.

---

## Manual setup (developing the engine directly)

Use this path if you're working on the game engine in isolation, running the automated tests, or playtesting from the terminal. It sets up MySQL, Python, and the word list on your own machine rather than in containers.

### 1. Install MySQL

**Windows**

Easiest path is the MySQL Installer from https://dev.mysql.com/downloads/installer/, which handles initialization, the service, and the root password for you. If you use that, skip to step 3.

If you installed from the ZIP archive instead (or via `winget`/`wget` and got only the binaries), you have to initialize the database and register the service yourself. Confirm that's your situation:

```powershell
Get-Service | Where-Object {$_.Name -like "*MySQL*"}
dir "C:\Program Files\MySQL\MySQL Server 8.4"
```

If the first command prints nothing and there's no `data` folder in the second, continue below.

**Open PowerShell as Administrator** (right-click PowerShell, then Run as administrator). This is required, because writing under `C:\Program Files` without elevation fails with `OS errno 13 - Permission denied`.

```powershell
cd "C:\Program Files\MySQL\MySQL Server 8.4\bin"
.\mysqld --initialize-insecure --console
.\mysqld --install MySQL84
Start-Service MySQL84
```

`--initialize-insecure` creates the root account with no password, which is fine for local development and avoids the temporary-password lookup. Adjust the version folder to match your install.

If it complains the data directory isn't empty, delete the `data` folder and re-run.

To set a root password afterward:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_password';
```

**macOS**
```
brew install mysql
brew services start mysql
```

**Linux (Debian/Ubuntu)**
```
sudo apt update && sudo apt install mysql-server
sudo systemctl start mysql
```

### 2. Make sure `mysql` is on your PATH

**Windows:** it isn't by default. First find the real folder name, which won't include a patch number:

```powershell
dir "C:\Program Files\MySQL"
```

That prints something like `MySQL Server 8.4`. Add that folder plus `\bin` to your PATH:

*GUI method*
1. Press Win, type "environment variables", open **Edit the system environment variables**
2. Click **Environment Variables...**
3. Under **User variables**, select the existing `Path` variable, click **Edit**
4. Click **New**, paste `C:\Program Files\MySQL\MySQL Server 8.4\bin`
5. OK out of all three dialogs

*PowerShell method*
```powershell
[Environment]::SetEnvironmentVariable(
  "Path",
  [Environment]::GetEnvironmentVariable("Path", "User") + ";C:\Program Files\MySQL\MySQL Server 8.4\bin",
  "User"
)
```

Either way, **open a new terminal afterward**, because PATH changes only apply to processes started after the edit. If you're using VS Code's integrated terminal, restart VS Code itself, not just the terminal pane.

Verify:
```powershell
mysql --version
$env:Path -split ';' | Select-String MySQL
```

**macOS/Linux:** should work out of the box. Verify with `mysql --version`.

### 3. Connect to MySQL as root

The exact command varies by platform:

| Platform | Command |
|---|---|
| Windows | `mysql -u root -p` (enter the password from the installer) |
| macOS (Homebrew) | `mysql -u root` (no password by default) |
| Linux (Ubuntu) | `sudo mysql` (root uses socket auth, not a password) |

### 4. Create the databases and app user

At the `mysql>` prompt:
```sql
CREATE DATABASE cp476_afterhours;
CREATE DATABASE cp476_afterhours_test;
CREATE USER 'afterhours'@'localhost' IDENTIFIED BY 'afterhours_dev';
GRANT ALL PRIVILEGES ON cp476_afterhours.* TO 'afterhours'@'localhost';
GRANT ALL PRIVILEGES ON cp476_afterhours_test.* TO 'afterhours'@'localhost';
FLUSH PRIVILEGES;
exit
```

Two databases: the real one you develop and playtest against, and a throwaway one the test suite uses so a crashed or interrupted test run can never corrupt your working data.

### 5. Run the schema against both

From inside `Games/Game1/GameEngine/`, using whichever root command worked in step 3. The schema lives at `db/01_schema.sql`.

**Windows (PowerShell).** `<` isn't a valid redirection operator, so pipe instead:
```powershell
Get-Content db\01_schema.sql | mysql -u root cp476_afterhours
Get-Content db\01_schema.sql | mysql -u root cp476_afterhours_test
```

**macOS/Linux**
```bash
mysql -u root -p cp476_afterhours < db/01_schema.sql
mysql -u root -p cp476_afterhours_test < db/01_schema.sql
```

The schema uses unqualified table names, so the target database is whichever one you name on the command line. If you forget to name one you'll get "No database selected" rather than tables landing somewhere unexpected. Re-running is safe, since every statement is `CREATE TABLE IF NOT EXISTS`.

### 6. Install Python dependencies

Use a virtual environment so this doesn't collide with system Python:

```
python -m venv .venv
```

Activate it:

| Platform | Command |
|---|---|
| Windows (PowerShell) | `.venv\Scripts\Activate.ps1` |
| Windows (cmd) | `.venv\Scripts\activate.bat` |
| macOS/Linux | `source .venv/bin/activate` |

Then:
```
pip install -r requirements.txt
```

Keep the venv activated for everything below. If `python` isn't recognized on macOS/Linux outside the venv, use `python3`.

### 7. Load the starter word list

The CSV is not loaded automatically in manual setup. With the venv active, from inside `Games/Game1/GameEngine/`:

```
python -c "from word_bank import word_bank; print(word_bank.migrate_csv('slang_words.csv'))"
```

It prints the number of new word/category links created. `migrate_csv` is idempotent, since `Term_Category` has a composite primary key, so re-running skips anything already there and prints `0`.

The test suite loads the CSV into the test database itself, so you only need this for the real one.

---

## Configuration

`word_bank.py` reads these environment variables, falling back to the defaults below. In manual setup you only need to set them if your credentials differ. Under Docker they are set for you in `docker-compose.yml`. Note that `MYSQL_HOST` there is `db`, the database service name, not `localhost`.

```
MYSQL_HOST=localhost
MYSQL_USER=afterhours
MYSQL_PASSWORD=afterhours_dev
MYSQL_DATABASE=cp476_afterhours
MYSQL_PORT=3306
```

`conftest.py` overrides `MYSQL_DATABASE` to `cp476_afterhours_test` for the duration of a test run.

---

## Running the tests

The test suite is part of the manual-setup workflow. Run it against a local MySQL, not the container. From inside `Games/Game1/GameEngine/`, with MySQL running and the venv active:

```
pytest test_slangengine.py test_word_bank.py -v
```

Expect `23 passed`. Both files can also be run separately.

Tests run against `cp476_afterhours_test`, never your real database. If a run leaves the test database in a weird state, reset it:

```
mysql -u root -p -e "DROP DATABASE cp476_afterhours_test; CREATE DATABASE cp476_afterhours_test;"
mysql -u root -p cp476_afterhours_test < db/01_schema.sql
```

MySQL does have to actually be running for any of this to work.

---

## Playtesting (actually playing a game)

```
python play_cli.py
```

Enter player names when prompted, then take turns typing words as whichever player is currently up. `quit` at any prompt exits cleanly.

Unlike the test suite, this uses the real 15-second turn and vote timers, so sitting on a prompt too long costs a life, same as it would for a real laggy player. To speed this up while manually testing, temporarily lower `TURN_SECONDS`/`VOTE_SECONDS` at the top of `slangengine.py` and change them back before committing.

### What to try
- **A recognized word** (e.g. `yeet`, `rizz`) is instantly accepted, no vote.
- **A made-up word** opens a bullsh\*t vote for the other players.
  - If the vote passes (enough "bullsh\*t" votes), the submitter loses a life and the word is discarded.
  - If the vote times out without enough votes, the word stands and gets logged for human review (see `Logs_table` below).
- **Letting a turn's clock run out** costs the current player a life.
- **Losing 3 lives** means that player is eliminated and the game ends.

---

## The database: 4 tables, what each one is actually for

The schema was designed by the team for production MySQL. `Terms` and `Categories` are linked many-to-many through `Term_Category`, rather than a word belonging to exactly one category.

```sql
CREATE TABLE IF NOT EXISTS Terms (
  term_id INT AUTO_INCREMENT PRIMARY KEY,
  term VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS Categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS Term_Category (
  term_id INT,
  category_id INT,
  PRIMARY KEY (term_id, category_id),
  FOREIGN KEY (term_id) REFERENCES Terms(term_id),
  FOREIGN KEY (category_id) REFERENCES Categories(category_id)
);

CREATE TABLE IF NOT EXISTS Logs_table (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT,
  log VARCHAR(32) NOT NULL,
  FOREIGN KEY (category_id) REFERENCES Categories(category_id)
);
```

**`Terms`** holds every real, gameplay-valid word as its own row (`rizz`, `yeet`, and so on). Just the word text and its ID, with no category information on this table directly, since a term can belong to more than one category.

**`Categories`** holds the categories words can belong to. In this project that's currently `"Slang Words"` (the real gameplay category) plus one reserved row, `"Candidates"`, which doesn't hold real gameplay words at all. It's a marker used to organize the review queue in `Logs_table`.

**`Term_Category`** is the junction table connecting the two. A word only counts as valid for a given category once a row exists here linking its `term_id` to that category's `category_id`. This is exactly what `word_bank.contains(word, category)` checks, using a `JOIN` across all three tables rather than a lookup on `Terms` alone.

**`Logs_table`** is the candidate review queue. When a submitted word survives a bullsh\*t vote by running out the clock, it is not immediately written into `Terms`/`Term_Category`. It's just logged here as raw text (`log`, capped at 32 characters) tagged against the `"Candidates"` category. It stays here, not valid for gameplay, until a human moderator calls `word_bank.promote_candidate(word, category)`, which is the moment it actually gets written into `Terms` and linked via `Term_Category`. Calling `reject_candidate(word)` instead just deletes the log entry, and since nothing was ever added to `Terms`, there's nothing to undo there.

This design was a deliberate simplification. The schema has no column to record who submitted a candidate word, only that one was submitted. `word_bank.add_candidate()` still accepts an `added_by` argument for compatibility with how the engine calls it, but the value is intentionally discarded.

### Manually reviewing candidates

There's no UI for this yet, so it's done directly through `word_bank.py`:
```
python -c "from word_bank import word_bank; print(word_bank.list_candidates())"
python -c "from word_bank import word_bank; print(word_bank.promote_candidate('someword', 'Slang Words'))"
python -c "from word_bank import word_bank; print(word_bank.reject_candidate('someword'))"
```

Under Docker, prefix these with `docker compose exec backend` and use the full module path, for example:
```
docker compose exec backend python -c "from Games.Game1.GameEngine.word_bank import word_bank; print(word_bank.list_candidates())"
```

---

## Troubleshooting (manual setup)

**`ModuleNotFoundError: No module named 'mysql'`.** The venv isn't active, or dependencies aren't installed. Activate it and re-run `pip install -r requirements.txt`. Running `python -m pytest` instead of `pytest` guarantees the same interpreter is used.

**`2003 (HY000): Can't connect to MySQL server on 'localhost:3306'`.** MySQL isn't running. Start it with `services.msc` on Windows, `brew services start mysql` on macOS, or `sudo systemctl start mysql` on Linux.

**`1045 (28000): Access denied for user 'afterhours'@'localhost'`.** The app user wasn't created or lacks grants. Re-run setup step 4.

**`1049 (42000): Unknown database 'cp476_afterhours'`.** The database wasn't created. Re-run setup steps 4 and 5.

**`'mysql' is not recognized`** (Windows). PATH isn't set. See setup step 2, and open a new terminal afterward.

**`OS errno 13 - Permission denied` during `mysqld --initialize-insecure`** (Windows). PowerShell isn't elevated. Close it and reopen with Run as administrator.

**`mysql --version` still not recognized after editing PATH** (Windows). Either the terminal is stale (open a new one, and restart VS Code if using its integrated terminal) or the folder name is wrong. Run `dir "C:\Program Files\MySQL"` to get the exact name. MySQL 8.4 installs to `MySQL Server 8.4`, not `MySQL Server 8.4.9`.