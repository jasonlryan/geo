#!/bin/zsh
set -euo pipefail

ROOT_DIR="/Users/jasonryan/Documents/geo"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

RESET_DB=false
INSTALL=false

for arg in "$@"; do
  case "$arg" in
    --reset-db)
      RESET_DB=true
      shift
      ;;
    --install)
      INSTALL=true
      shift
      ;;
    *)
      ;;
  esac
done

echo "[dev] Cleaning up any existing dev servers on ports 8000/3000..."
for PORT in 8000 3000; do
  PIDS=$(lsof -ti tcp:$PORT 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo "[dev] Killing processes on :$PORT ($PIDS)"
    while IFS= read -r PID; do
      [ -n "$PID" ] && kill -9 "$PID" 2>/dev/null || true
    done <<< "$PIDS"
  fi
done

if [ "$RESET_DB" = true ]; then
  echo "[dev] Resetting SQLite DB (backend/demo.db)"
  rm -f "$BACKEND_DIR/demo.db"
fi

if [ "$INSTALL" = true ]; then
  echo "[dev] Installing backend dependencies..."
  cd "$BACKEND_DIR"
  python3 -m pip install -r requirements.txt

  echo "[dev] Installing frontend dependencies..."
  cd "$FRONTEND_DIR"
  npm install
fi

echo "[dev] Starting backend (uvicorn) on :8000..."
cd "$BACKEND_DIR"
PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACK_PID=$!

echo "[dev] Starting frontend (Next.js) on :3000..."
cd "$FRONTEND_DIR"
# Prefer local binary; fallback to npx to avoid global install issues
if [ ! -x "$FRONTEND_DIR/node_modules/.bin/next" ]; then
  echo "[dev] 'next' not found locally. Running npm install..."
  npm install
fi
PATH="$FRONTEND_DIR/node_modules/.bin:$PATH" next dev -p 3000 &
FRONT_PID=$!

echo "$BACK_PID" > "$ROOT_DIR/.dev_pids"
echo "$FRONT_PID" >> "$ROOT_DIR/.dev_pids"

echo "[dev] Backend PID: $BACK_PID"
echo "[dev] Frontend PID: $FRONT_PID"
echo "[dev] Logs will appear in the respective terminals. To stop servers: xargs kill -9 < $ROOT_DIR/.dev_pids"

