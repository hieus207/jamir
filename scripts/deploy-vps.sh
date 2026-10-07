#!/usr/bin/env bash
# Run ON the VPS from /home/jamir/src: build in place and publish.
#   web → /home/jamir/site, api → /home/jamir/api (systemd jamir-api)
# Data (/home/jamir/data), uploads and api.env are never touched.
# Usage: scripts/deploy-vps.sh [--web-only]
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=${DEPLOY_ROOT:-/home/jamir}
export PATH=/opt/node22/bin:$PATH   # vite 8 needs Node >= 20 (system node is 18)

[[ -d node_modules ]] || npm ci --no-audit --no-fund
npm run build

find $ROOT/site -mindepth 1 -maxdepth 1 ! -name media -exec rm -rf {} +
cp -r dist/. $ROOT/site/
chmod -R a+rX $ROOT/site

if [[ "${1:-}" != "--web-only" ]]; then
  npm run build:api
  rm -rf $ROOT/api/dist $ROOT/api/seed $ROOT/api/deploy
  mkdir -p $ROOT/api/dist
  cp server/dist/index.mjs $ROOT/api/dist/
  cp -r server/seed server/deploy $ROOT/api/
  systemctl restart jamir-api
  for i in $(seq 10); do curl -fsS http://127.0.0.1:3001/api/health >/dev/null 2>&1 && break; sleep 1; done
fi
curl -fsS http://127.0.0.1/api/health >/dev/null && echo "Deployed: web + api ok"
