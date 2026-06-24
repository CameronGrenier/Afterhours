# Afterhours

## Overview

This project is a multiplayer party game web app where users can create or join lobbies and play mini games together online. 
The app focuses on simple lobby creation, easy joining through lobby codes, and real time gameplay updates between players.

## Team Members

* Jake
* Cameron
* Arpit
* Ethan
* Smaran
* Daniel
* Gabriel
* Alec
* Micheal
* Mathew

## Project Description

The app allows users to host or join a multiplayer lobby, enter a display name, select a mini game, and play with other connected users in real time. 
The main problem it solves is making it easy for groups of people to quickly start and play casual online games together without needing accounts or complicated setup.

## Tech Stack

* Frontend: React
* Backend: Node.js
* Real time Communication: WebSockets / Socket.IO
* Hosting: AWS ECS
* Database: DynamoDB
* Project Management: GitHub Projects

## Repository Structure

This section will be updated as the project is developed.

## Current Status

Milestone 01

## Setup Instructions

### Backend
1. cd into the `/backend` directory
2. create a virtual environment `python -m venv .venv` or `python3 -m venv .venv`
3. activate venv
    - `source .venv/bin/activate` on Mac and Linux
    - `.venv/Scripts/activate` on Windows
4. install requirements `pip install -r requirements.txt`
4. run local backend `uvicorn room_manager:socket_app --port 8000 --reload`

### Frontend
1. cd into the `/frontend` directory
2. install requirements `npm i`
3. run frontend `npm run dev`
