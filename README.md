# Afterhours

A multiplayer party game web app. Users create or join a lobby with a short code, pick a mini game, and play together in real time. No accounts, no setup.

## Current Status

Milestone 03
## Team Members

* Jake
* Cameron
* Ethan
* Smaran
* Daniel
* Gabriel
* Alec
* Micheal
* Mathew

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4 |
| Backend | Python 3.14, FastAPI, Uvicorn |
| Real time | Socket.IO |
| Database | MySQL 8.4 |
| Containers | Docker Compose |
| Project management | GitHub Projects |

## Repository Structure

```
Afterhours/
├── docker-compose.yml   # Runs the full stack: database, backend, frontend
├── backend/             # FastAPI + Socket.IO server. See backend/README.md
│   └── db/              # SQL files auto-run by MySQL on first boot
│   └── games/           # Contains all game engines
└── frontend/            # React SPA. See frontend/README.md
```


---

## Running the project

Docker is the recommended way to run everything. It starts the database, backend, and frontend together, and requires no local install of MySQL, Python, or Node.

### 1. Install Docker

**Windows.** Install Docker Desktop from https://docs.docker.com/desktop/install/windows-install/. It uses the WSL 2 backend and will set that up during install. A reboot is usually required afterward.

**macOS.** Install Docker Desktop from https://docs.docker.com/desktop/install/mac-install/. Pick the Apple Silicon or Intel build to match your machine.

**Linux.** Install Docker Engine and the Compose plugin for your distribution: https://docs.docker.com/engine/install/. Docker Desktop is optional on Linux.

### 2. Start Docker

On Windows and macOS, launch Docker Desktop and wait for the whale icon to stop animating. If the engine is not running, every `docker` command fails with a connection error.

On Linux, make sure the daemon is active:

```
sudo systemctl start docker
```

### 3. Run the stack

From the project root, the folder containing `docker-compose.yml`:

```
docker compose up --build
```

The first run pulls the base images and builds the app images, so it takes a few minutes. Later runs are much faster.

Three containers start in order:

1. **db** is MySQL 8.4. On first boot it creates the database and app user, then runs `backend/db/01_schema.sql` to create the tables and `backend/db/02_words.sql` to load the Slang word list.
2. **backend** is FastAPI and Socket.IO on port 8000. It waits until the database reports healthy before starting.
3. **frontend** is the Vite dev server on port 5173.

### 4. Open the app

```bash
http://localhost:5173
```

The backend API is at `http://localhost:8000` if you want to hit it directly.

### Stopping

Press `Ctrl+C` in the terminal. To also remove the containers and network:

```bash
docker compose down
```

### Resetting the database

MySQL only runs the SQL files in `backend/db/` on its very first boot, while its data directory is empty. To apply changes to those files, wipe the data and start fresh:

```bash
docker compose down -v
docker compose up --build
```

Without `-v`, the old data survives and the SQL files are skipped.

## Running tests
An automated test suite is available by simply running:

```bash
docker compose exec backend pytest -v
```

This will run all pytest files in the backend directory.

## Troubleshooting

**`cannot find the file specified` mentioning `dockerDesktopLinuxEngine`.** Docker Desktop is not running. Start it and wait for the whale icon to settle.

**`permission denied` on the Docker socket (Linux).** Add yourself to the `docker` group with `sudo usermod -aG docker $USER`, then log out and back in.

**Ports 5173, 8000, or 3306 already in use.** Something else is running on that port, often a local dev server or a local MySQL service. Stop it, or change the host side of the port mapping in `docker-compose.yml`.

**Backend exits with `Can't connect to MySQL server on 'db:3306'`.** The backend started before MySQL was ready. The database healthcheck in `docker-compose.yml` prevents this, so confirm it is still present.

---

## Running without Docker

Use this if you are developing on the backend or frontend directly. It needs Python 3.14, Node 24, and a local MySQL 8.4 server.

**Backend**

```
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --port 8000 --reload
```

**Frontend**

```
cd frontend
npm install
npm run dev
```

Slang also needs a MySQL database with the schema and word list loaded. Full instructions are in `backend/Games/Game1/GameEngine/README.md`.

## More Information

See `frontend/README.md` and `backend/README.md` for architecture, API routes, and socket events.