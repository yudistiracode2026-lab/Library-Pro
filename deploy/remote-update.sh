#!/usr/bin/env bash
# Runs on the hosting server: installs ~/pustagra-release.tar.gz (made by
# scripts/release.sh) over the live app. .env and uploaded files are not in
# the package, so they are kept.
#
#   ssh -p 65002 user@host 'bash -s' < deploy/remote-update.sh
set -euo pipefail

APP=${APP:-$HOME/pustagra-app}
PACKAGE=$HOME/pustagra-release.tar.gz

cd "$APP"
php artisan down --retry=15 || true
trap 'php artisan up' EXIT

# Keep the existing folders' permissions: a private app folder means 404 for everyone.
tar -xzf "$PACKAGE" -C "$APP" --no-overwrite-dir
# Caches from the previous version may name classes that changed.
rm -f bootstrap/cache/*.php

php artisan migrate --force
php artisan optimize
chmod -R ug+rwX storage bootstrap/cache
rm -f "$PACKAGE"

echo "Terpasang: $(date '+%F %T')"
