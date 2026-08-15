#!/usr/bin/env bash
# Install the ship-me skills into Claude Code.
#
#   ./install.sh              symlink into ~/.claude/skills (updates with git pull)
#   ./install.sh --copy       copy instead of symlink
#   ./install.sh --project .  install into <path>/.claude/skills for one project
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/skills"
DEST="$HOME/.claude/skills"
MODE="symlink"

while [ $# -gt 0 ]; do
  case "$1" in
    --copy)    MODE="copy"; shift ;;
    --project) DEST="$(cd "$2" && pwd)/.claude/skills"; shift 2 ;;
    -h|--help) sed -n '2,7p' "$0" | sed 's/^# \?//'; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 1 ;;
  esac
done

mkdir -p "$DEST"

for skill in "$SRC"/*/; do
  name="$(basename "$skill")"
  target="$DEST/$name"

  if [ -e "$target" ] || [ -L "$target" ]; then
    printf 'skip   %s (already exists at %s)\n' "$name" "$target"
    continue
  fi

  if [ "$MODE" = "copy" ]; then
    cp -R "$skill" "$target"
  else
    ln -s "$skill" "$target"
  fi
  printf '%-6s %s\n' "$MODE" "$name"
done

echo
echo "Done. Restart Claude Code, then try:  /grill-me <the thing you're stuck on>"
