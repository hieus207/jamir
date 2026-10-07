#!/usr/bin/env bash
# Build locally and publish dist/ (+ public/media) to the VPS nginx root.
# Usage: scripts/deploy.sh [--media]
set -euo pipefail
cd "$(dirname "$0")/.."
HOST=${DEPLOY_HOST:-vps}
ROOT=${DEPLOY_ROOT:-/home/jamir/site}
TMP=$(mktemp -d)

npm run build
tar czf "$TMP/site.tgz" --exclude=media -C dist .
scp -q "$TMP/site.tgz" "$HOST:/tmp/jamir-site.tgz"
ssh "$HOST" "mkdir -p $ROOT && find $ROOT -mindepth 1 -maxdepth 1 ! -name media -exec rm -rf {} + && tar xzf /tmp/jamir-site.tgz -C $ROOT && chmod -R a+rX $ROOT"

if [[ "${1:-}" == "--media" ]]; then
  tar czf "$TMP/media.tgz" -C public media
  scp -q "$TMP/media.tgz" "$HOST:/tmp/jamir-media.tgz"
  ssh "$HOST" "rm -rf $ROOT/media && tar xzf /tmp/jamir-media.tgz -C $ROOT && chmod -R a+rX $ROOT/media"
fi
rm -rf "$TMP"
echo "Deployed to $HOST:$ROOT"
