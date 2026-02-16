#!/usr/bin/env bash
set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [[ "$FILE_PATH" != *"/src/store/kysely/migrations/"* ]]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"
bun run db:latest
bun run db:generate
