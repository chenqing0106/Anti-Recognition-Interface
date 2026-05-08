#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${APP_NAME:-anti-recognition-interface}"
SERVER_HOST="${SERVER_HOST:?Set SERVER_HOST, for example: SERVER_HOST=1.2.3.4}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_PORT="${SERVER_PORT:-22}"
SERVER_PATH="${SERVER_PATH:-/var/www/${APP_NAME}}"
DOMAIN="${DOMAIN:-}"
SSH_KEY="${SSH_KEY:-}"
SKIP_BUILD="${SKIP_BUILD:-0}"
SETUP_NGINX="${SETUP_NGINX:-0}"

SSH_OPTS=(-p "$SERVER_PORT")
if [[ -n "$SSH_KEY" ]]; then
  SSH_OPTS+=(-i "$SSH_KEY")
fi

REMOTE="${SERVER_USER}@${SERVER_HOST}"

if [[ "$SKIP_BUILD" != "1" ]]; then
  npm run lint
  npm run build
fi

ssh "${SSH_OPTS[@]}" "$REMOTE" "mkdir -p '$SERVER_PATH'"
rsync -az --delete -e "ssh ${SSH_OPTS[*]}" dist/ "${REMOTE}:${SERVER_PATH}/"

if [[ "$SETUP_NGINX" == "1" ]]; then
  SERVER_NAME="${DOMAIN:-_}"
  ssh "${SSH_OPTS[@]}" "$REMOTE" "cat > /etc/nginx/conf.d/${APP_NAME}.conf <<'NGINX'
server {
    listen 80;
    server_name ${SERVER_NAME};
    root ${SERVER_PATH};
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff2?)$ {
        expires 30d;
        add_header Cache-Control \"public, immutable\";
        try_files \$uri =404;
    }
}
NGINX
nginx -t && systemctl reload nginx"
fi

echo "Deployed ${APP_NAME} to ${REMOTE}:${SERVER_PATH}"
if [[ -n "$DOMAIN" ]]; then
  echo "Open: http://${DOMAIN}"
else
  echo "Open: http://${SERVER_HOST}"
fi
