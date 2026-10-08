#!/usr/bin/env bash
# Fresh Ubuntu (22.04 / 24.04) → running JAMIR. Run as root ON the new server:
#   curl -fsSL https://raw.githubusercontent.com/hieus207/jamir/main/scripts/setup-new-vps.sh | bash -s -- [domain]
# or: bash scripts/setup-new-vps.sh [domain]
#
# Content (JSON data, uploads, product media) is NOT in git — copy it from the old
# server afterwards, see docs/DEPLOY.md ("Chuyển dữ liệu từ VPS cũ").
set -euo pipefail
DOMAIN=${1:-}
REPO=${REPO:-https://github.com/hieus207/jamir.git}
ROOT=/home/jamir
NODE_DIR=/opt/node22

echo "==> packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq nginx git curl xz-utils openssl rsync >/dev/null

echo "==> Node 22 ($NODE_DIR)"
if [[ ! -x $NODE_DIR/bin/node ]]; then
  V=$(curl -fsSL https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt | grep -o 'node-v22[^ ]*-linux-x64.tar.xz' | head -1)
  curl -fsSLo /tmp/$V https://nodejs.org/dist/latest-v22.x/$V
  mkdir -p $NODE_DIR && tar xJf /tmp/$V -C $NODE_DIR --strip-components=1 && rm /tmp/$V
fi
export PATH=$NODE_DIR/bin:$PATH
node -v

echo "==> code"
mkdir -p $ROOT/{site,api,data,uploads}
if [[ -d $ROOT/src/.git ]]; then git -C $ROOT/src pull --ff-only; else rm -rf $ROOT/src && git clone --depth 1 "$REPO" $ROOT/src; fi
mkdir -p $ROOT/site/media

echo "==> secrets ($ROOT/api.env)"
if [[ ! -f $ROOT/api.env ]]; then
  cat > $ROOT/api.env <<ENV
PORT=3001
HOST=127.0.0.1
DATA_DIR=$ROOT/data
SEED_DIR=$ROOT/api/seed
MEDIA_DIR=$ROOT/uploads
MEDIA_URL=/media/uploads
SITE_DIR=$ROOT/site
PUBLIC_URL=${DOMAIN:+https://$DOMAIN}
AUTH_SECRET=$(openssl rand -hex 32)
ADMIN_EMAIL=admin@jamir.vn
ADMIN_PASSWORD=$(openssl rand -base64 12 | tr -d '/+=')
GOOGLE_CLIENT_ID=
ENV
  chmod 600 $ROOT/api.env
fi

echo "==> systemd + nginx"
sed "s#@ROOT@#$ROOT#g" $ROOT/src/server/deploy/jamir-api.service > /etc/systemd/system/jamir-api.service
sed "s#@ROOT@#$ROOT#g" $ROOT/src/server/deploy/nginx.conf > /etc/nginx/sites-available/jamir
[[ -n $DOMAIN ]] && sed -i "s#server_name _;#server_name $DOMAIN www.$DOMAIN;#" /etc/nginx/sites-available/jamir
ln -sf /etc/nginx/sites-available/jamir /etc/nginx/sites-enabled/jamir
rm -f /etc/nginx/sites-enabled/default
systemctl daemon-reload
systemctl enable -q jamir-api

echo "==> build + start"
cd $ROOT/src
npm ci --no-audit --no-fund
bash scripts/deploy-vps.sh
nginx -t && systemctl reload nginx

if [[ -n $DOMAIN ]]; then
  echo "==> HTTPS (Let's Encrypt) — the domain's DNS must already point here"
  apt-get install -y -qq certbot python3-certbot-nginx >/dev/null
  certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN" --redirect || echo "!! certbot failed — check DNS, then rerun: certbot --nginx -d $DOMAIN"
fi

echo
echo "Done. Admin: $(grep ^ADMIN_EMAIL $ROOT/api.env | cut -d= -f2) / $(grep ^ADMIN_PASSWORD $ROOT/api.env | cut -d= -f2)"
echo "Next: copy data + media from the old server (docs/DEPLOY.md)."
