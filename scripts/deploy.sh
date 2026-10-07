#!/usr/bin/env bash
# Build locally and publish to the VPS:
#   web  dist/          → $ROOT/site        (nginx root)
#   api  server bundle  → $ROOT/api         (systemd: jamir-api, 127.0.0.1:3001)
#   src  source code    → $ROOT/src
# Live JSON data ($ROOT/data), uploads ($ROOT/uploads) and $ROOT/api.env are never overwritten.
# Usage: scripts/deploy.sh [--media]   (--media also uploads public/media)
set -euo pipefail
cd "$(dirname "$0")/.."
HOST=${DEPLOY_HOST:-vps}
ROOT=${DEPLOY_ROOT:-/home/jamir}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

npm run build
npm run build:api

tar czf "$TMP/site.tgz" --exclude=media -C dist .
tar czf "$TMP/api.tgz" -C server dist/index.mjs seed deploy
# tracked + new files, without build output or local data
git ls-files --cached --others --exclude-standard -z | grep -zv '^server/data/' | tar czf "$TMP/src.tgz" --null -T -
scp -q "$TMP/site.tgz" "$TMP/api.tgz" "$TMP/src.tgz" "$HOST:/tmp/"

ssh "$HOST" ROOT="$ROOT" bash -s <<'EOF'
set -euo pipefail
mkdir -p $ROOT/site $ROOT/api $ROOT/src $ROOT/data $ROOT/uploads

# web
find $ROOT/site -mindepth 1 -maxdepth 1 ! -name media -exec rm -rf {} +
tar xzf /tmp/site.tgz -C $ROOT/site

# source
find $ROOT/src -mindepth 1 -maxdepth 1 -exec rm -rf {} +
tar xzf /tmp/src.tgz -C $ROOT/src

# api
rm -rf $ROOT/api/dist $ROOT/api/seed
tar xzf /tmp/api.tgz -C $ROOT/api
if [[ ! -f $ROOT/api.env ]]; then
  cat > $ROOT/api.env <<ENV
PORT=3001
HOST=127.0.0.1
DATA_DIR=$ROOT/data
SEED_DIR=$ROOT/api/seed
MEDIA_DIR=$ROOT/uploads
MEDIA_URL=/media/uploads
AUTH_SECRET=$(openssl rand -hex 32)
ADMIN_EMAIL=admin@jamir.vn
ADMIN_PASSWORD=$(openssl rand -base64 12 | tr -d '/+=')
GOOGLE_CLIENT_ID=
ENV
  chmod 600 $ROOT/api.env
  echo "Created $ROOT/api.env (admin password inside)"
fi
sed "s#@ROOT@#$ROOT#g" $ROOT/api/deploy/jamir-api.service > /etc/systemd/system/jamir-api.service
sed "s#@ROOT@#$ROOT#g" $ROOT/api/deploy/nginx.conf > /etc/nginx/sites-available/jamir
ln -sf /etc/nginx/sites-available/jamir /etc/nginx/sites-enabled/jamir

chmod -R a+rX $ROOT/site $ROOT/uploads
systemctl daemon-reload
systemctl enable -q jamir-api
systemctl restart jamir-api
nginx -t -q && systemctl reload nginx
rm -f /tmp/site.tgz /tmp/api.tgz /tmp/src.tgz

for i in 1 2 3 4 5 6 7 8 9 10; do curl -fsS http://127.0.0.1:3001/api/health >/dev/null 2>&1 && break; sleep 1; done
curl -fsS http://127.0.0.1/api/health && echo " api ok"
EOF

if [[ "${1:-}" == "--media" ]]; then
  tar czf "$TMP/media.tgz" -C public media
  scp -q "$TMP/media.tgz" "$HOST:/tmp/jamir-media.tgz"
  ssh "$HOST" "rm -rf $ROOT/site/media && tar xzf /tmp/jamir-media.tgz -C $ROOT/site && chmod -R a+rX $ROOT/site/media && rm /tmp/jamir-media.tgz"
fi
echo "Deployed to $HOST:$ROOT"
