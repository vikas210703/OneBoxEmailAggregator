#!/usr/bin/env bash
# Bulk-import .env into Netlify using netlify-cli
# Usage: ./scripts/netlify/import_envs.sh [--site SITE_ID] [.env-file]
set -euo pipefail
ENV_FILE=".env"
SITE_ARG=""
if [ "$#" -ge 1 ]; then
  if [ "$1" = "--site" ]; then
    SITE_ARG="$2"
    shift 2
  else
    ENV_FILE="$1"
    shift
  fi
fi
if [ "$#" -ge 1 ]; then
  ENV_FILE="$1"
fi
if [ ! -f "$ENV_FILE" ]; then
  echo "Env file '$ENV_FILE' not found"
  exit 1
fi
# Ensure netlify CLI is installed
if ! command -v netlify >/dev/null 2>&1; then
  echo "netlify CLI not found. Install with: npm install -g netlify-cli"
  exit 1
fi
# Import lines skipping comments and blank lines
# If SITE_ARG provided use --site option
while IFS= read -r line; do
  # skip comments and blank
  [[ "$line" =~ ^\s*# ]] && continue
  [[ -z "$line" ]] && continue
  key="${line%%=*}"
  val="${line#*=}"
  if [ -n "$SITE_ARG" ]; then
    netlify env:set "$key" "$val" --site "$SITE_ARG"
  else
    netlify env:set "$key" "$val"
  fi
done < <(sed -E 's/\r$//' "$ENV_FILE")

echo "Imported envs from $ENV_FILE"
