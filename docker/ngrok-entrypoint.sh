#!/bin/sh
set -eu

NGROK_AUTHTOKEN="${NGROK_AUTHTOKEN:-${TOKEN_NGROK:-}}"

if [ -z "$NGROK_AUTHTOKEN" ]; then
  echo "Missing required environment variable: NGROK_AUTHTOKEN or TOKEN_NGROK" >&2
  exit 1
fi

if [ -z "${NGROK_DOMAIN:-}" ]; then
  echo "Missing required environment variable: NGROK_DOMAIN" >&2
  exit 1
fi

export NGROK_AUTHTOKEN
exec ngrok http --url="$NGROK_DOMAIN" nginx:80 --log=stdout
