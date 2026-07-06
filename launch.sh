#!/usr/bin/env bash
# Launches both the rampr server and client for local development.
#
# The crons are NOT started here — they're scheduled jobs (Railway daily poll +
# weekly cleanup). Run a one-off locally: cd cron-poller && npm start
#                                          cd cron-cleanup && npm start

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

shutdown() {
  echo ""
  echo "Shutting down..."
  kill $SERVER_PID $CLIENT_PID 2>/dev/null
  wait $SERVER_PID $CLIENT_PID 2>/dev/null
  echo "Done."
}
trap shutdown EXIT INT TERM

# Install dependencies if needed (client + server only — the crons are launched separately)
if [ ! -d "$ROOT_DIR/server/node_modules" ]; then
  echo "Installing server dependencies..."
  (cd "$ROOT_DIR/server" && npm install)
fi
if [ ! -d "$ROOT_DIR/client/node_modules" ]; then
  echo "Installing client dependencies..."
  (cd "$ROOT_DIR/client" && npm install)
fi

# Optionally apply the schema if a database is reachable (idempotent enough for a fresh DB).
if [ -n "$DATABASE_URL" ] && command -v psql >/dev/null 2>&1; then
  echo "Applying schema.sql to $DATABASE_URL..."
  psql "$DATABASE_URL" -f "$ROOT_DIR/schema.sql" >/dev/null 2>&1 || echo "Skipping schema (already applied or DB unreachable)."
fi

# Start server first
echo "Starting API server on port ${PORT:-3001}..."
(cd "$ROOT_DIR/server" && npm run dev) &
SERVER_PID=$!

# Brief pause to let the server start
sleep 1

# Start client
echo "Starting client on http://localhost:5173..."
(cd "$ROOT_DIR/client" && npm run dev) &
CLIENT_PID=$!

wait
