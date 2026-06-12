#!/bin/sh
set -e

echo "→ Generating Prisma client..."
npx prisma generate

echo "→ Syncing database schema..."
npx prisma db push --skip-generate

echo "→ Starting Next.js..."
exec npm start
