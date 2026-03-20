#!/bin/sh
set -eu

data_dir="${APP_DATA_DIR:-/app/data}"

mkdir -p "$data_dir"

if [ "$(id -u)" = "0" ]; then
  chown -R appuser:appuser "$data_dir" 2>/dev/null || true
  chmod 0775 "$data_dir" 2>/dev/null || true
  exec su-exec appuser "$@"
fi

exec "$@"
