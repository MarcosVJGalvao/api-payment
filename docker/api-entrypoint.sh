#!/bin/sh
set -eu

if [ -z "${PORT:-}" ]; then
  export PORT="3000"
fi

if [ -z "${APP_PUBLIC_BASE_URL:-}" ] && [ -n "${NGROK_DOMAIN:-}" ]; then
  export APP_PUBLIC_BASE_URL="https://${NGROK_DOMAIN}"
fi

if [ -z "${REDIS_HOST:-}" ]; then
  export REDIS_HOST="redis"
elif [ "${REDIS_HOST}" = "localhost" ]; then
  export REDIS_HOST="host.docker.internal"
fi

exec pm2-runtime dist/main.js --name api-payments
