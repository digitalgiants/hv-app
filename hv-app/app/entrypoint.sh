#!/bin/sh
set -e

echo "→ Syncing database schema..."
npx prisma db push --skip-generate

echo "→ Starting Next.js..."
exec npm start
