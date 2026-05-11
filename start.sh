#!/bin/bash

# ─────────────────────────────────────────────
#  UTCN Events — Full Stack Startup Script
# ─────────────────────────────────────────────

JAVA21="/opt/homebrew/Cellar/openjdk@21/21.0.10/libexec/openjdk.jdk/Contents/Home"
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_LOG="/tmp/backend.log"
FRONTEND_LOG="/tmp/frontend.log"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║      UTCN Events — Starting up       ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── 1. Docker services ─────────────────────
echo "▸ Starting Docker services (DB, RabbitMQ, pgAdmin, notification)..."
cd "$ROOT_DIR"
docker compose up -d

echo "▸ Waiting for PostgreSQL to be ready..."
until docker exec utcn-events-db pg_isready -U postgres -d utcnevents > /dev/null 2>&1; do
  sleep 1
done
# Extra wait: pg_isready passes before Postgres accepts TCP connections from the host
sleep 5
echo "  ✔ PostgreSQL is ready."

echo "▸ Waiting for RabbitMQ to be ready..."
until docker exec utcn-events-rabbitmq rabbitmq-diagnostics ping > /dev/null 2>&1; do
  sleep 1
done
echo "  ✔ RabbitMQ is ready."
sleep 3  # give services a moment to fully stabilise

# ── 2. Ktor backend ────────────────────────
echo ""
echo "▸ Building notification-service distribution (if needed)..."
if [ ! -f "$ROOT_DIR/notification-service/build/distributions/notification-service.tar" ]; then
  cd "$ROOT_DIR/notification-service"
  ../gradlew distTar
  cd "$ROOT_DIR"
fi

echo "▸ Starting Ktor backend (Java 21)..."
JAVA_HOME="$JAVA21" nohup "$ROOT_DIR/gradlew" -p "$ROOT_DIR" run > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID  (log: $BACKEND_LOG)"

echo "▸ Waiting for backend to start on :8080..."
for i in $(seq 1 60); do
  if grep -q "Responding at" "$BACKEND_LOG" 2>/dev/null; then
    echo "  ✔ Backend is up at http://localhost:8080"
    break
  fi
  if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "  ✖ Backend process died. Check $BACKEND_LOG for details."
    exit 1
  fi
  sleep 2
done

# ── 3. Angular frontend ────────────────────
echo ""
echo "▸ Starting Angular dev server in a new terminal window..."
cd "$ROOT_DIR/frontend"
# ng serve requires a real TTY (Angular CLI 18 + Node 22 compatibility).
# We open it in a new macOS Terminal window so it has one.
osascript -e "tell application \"Terminal\" to do script \"cd '$ROOT_DIR/frontend' && npm start\""
FRONTEND_PID="(see new Terminal window)"

echo "  ✔ Angular dev server starting — check the new Terminal window."
echo "  It will be ready at http://localhost:4200 in ~60s."

# ── Summary ───────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  All services are running!                           ║"
echo "║                                                      ║"
echo "║  Angular SPA   →  http://localhost:4200  (new tab)   ║"
echo "║  Ktor API      →  http://localhost:8080              ║"
echo "║  RabbitMQ UI   →  http://localhost:15672             ║"
echo "║  pgAdmin       →  http://localhost:5050              ║"
echo "║                                                      ║"
echo "║  Backend log   →  $BACKEND_LOG              ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "  Press Ctrl+C to stop the backend."
echo "  Run 'docker compose down' to stop Docker services."
echo ""

wait $BACKEND_PID
