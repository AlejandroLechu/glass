#!/usr/bin/env bash

###############################################################################
# codex_setup.sh – streamlined, low-verbosity install script for Codex
# Redirects heavy command output to log files so the Codex UI (and Chrome)   #
# never has to render megabytes of text – avoids the "Aw, Snap! error 5".     #
###############################################################################

# Exit on error, fail on unset vars
set -eo pipefail

# Directory to store logs
LOG_DIR="codex_logs"
mkdir -p "$LOG_DIR"

# Helper to run commands quietly but capture logs
run_step() {
  local description="$1"; shift
  local logfile="$LOG_DIR/${description// /_}.log"
  echo "- $description ..."  # minimal stdout for Codex UI
  # shellcheck disable=SC "$@" may contain multiple words
  if "$@" >"$logfile" 2>&1; then
    echo "  → done (log: $logfile)"
  else
    echo "  → FAILED (see $logfile)" >&2
    tail -n 40 "$logfile" >&2  || true
    exit 1
  fi
}

###############################################################################
# 1) Electron / desktop app (root)                                            #
###############################################################################
run_step "Root npm install" \
  npm install --no-audit --progress=false --fund=false --silent

###############################################################################
# 2) Next.js web frontend                                                     #
###############################################################################
run_step "Web npm install" \
  npm --prefix pickleglass_web install --no-audit --progress=false --fund=false --silent

run_step "Web build" \
  npm --prefix pickleglass_web run build --silent

###############################################################################
# 3) Python (FastAPI)                                                         #
###############################################################################
if command -v pip &>/dev/null; then
  run_step "Python deps" \
    python -m pip install --quiet -r pickleglass_web/requirements.txt
fi

###############################################################################
# 4) Firebase Functions (optional)                                            #
###############################################################################
if [ -d "functions" ]; then
  run_step "Functions npm install" \
    npm --prefix functions install --no-audit --progress=false --fund=false --silent
fi

###############################################################################
# 5) Lint (non-blocking)                                                      #
###############################################################################
if npm run | grep -q "lint"; then
  echo "• Linting (non-blocking)…"
  npm run lint --if-present --silent || true
fi

echo "✔️  Setup script finished – review individual log files in $LOG_DIR if needed." 