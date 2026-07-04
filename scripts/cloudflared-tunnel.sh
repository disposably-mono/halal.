#!/usr/bin/env bash
# Thin wrapper around `cloudflared tunnel` for local dev/demo hosting.
#
# 1. Formatting: runs cloudflared with structured `--output json` logs and
#    pipes them through scripts/cloudflared-format.jq, which prints one
#    compact, colorized line per event instead of cloudflared's raw
#    key=value text — and downgrades the well-known-benign
#    "stream N canceled by remote with error code 0" pattern (a client —
#    closed tab, page navigation, or an EventSource reconnect — abandoning
#    a request; HTTP/2 code 0 is NO_ERROR, a clean teardown) from a scary
#    ERR pair to a single informational line. See jq file for details.
#
# 2. --no-autoupdate: cloudflared checks for updates every 24h by default
#    and silently restarts itself (dropping every open connection,
#    including the app's live SSE monitor stream) when one is found. For a
#    tool fronting a live election, an unannounced mid-vote restart is a
#    real risk, not just log noise — so it's disabled here. Update
#    manually (`cloudflared update`) between elections instead.
#
# Usage: same arguments as `cloudflared tunnel`, e.g.:
#   scripts/cloudflared-tunnel.sh --url http://localhost:3000
set -euo pipefail

if ! command -v jq >/dev/null 2>&1; then
  echo "cloudflared-tunnel.sh: jq is required but not found on PATH" >&2
  exit 1
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"

COLOR=0
if [ -t 1 ]; then
  COLOR=1
fi

cloudflared tunnel --no-autoupdate --output json "$@" 2>&1 \
  | jq -r --unbuffered --arg color "$COLOR" -f "$SCRIPT_DIR/cloudflared-format.jq"
