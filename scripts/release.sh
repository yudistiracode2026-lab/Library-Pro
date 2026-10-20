#!/usr/bin/env bash
# Builds a ready-to-upload package for hosting without Node.js:
# production composer dependencies and compiled assets, from the last commit.
#
#   bash scripts/release.sh        ->  dist/pustagra-<commit>.tar.gz
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    echo "Peringatan: ada perubahan yang belum di-commit; paket hanya berisi commit terakhir." >&2
fi

commit=$(git rev-parse --short HEAD)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
# mktemp makes the folder private (700); the package root must stay readable by the web server.
chmod 755 "$work"

echo "Menyalin kode commit $commit..."
git archive HEAD | tar -x -C "$work"

(
    cd "$work"
    echo "Memasang dependensi PHP (tanpa paket dev)..."
    composer install --no-dev --optimize-autoloader --no-interaction --no-progress --prefer-dist
    echo "Membangun tampilan..."
    npm ci --no-audit --no-fund --loglevel=error
    npm run build
    rm -rf node_modules tests design .github public/hot
)

mkdir -p dist
out="dist/pustagra-$commit.tar.gz"
tar -czf "$out" -C "$work" .
echo "Selesai: $out ($(du -h "$out" | cut -f1))"
