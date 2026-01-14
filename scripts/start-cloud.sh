#!/bin/sh
set -e

# Run migrations if enabled
if [ "$RUN_MIGRATION" = "true" ]; then
  echo "Running Prisma DB Push..."
  npx prisma db push --accept-data-loss --skip-generate
  
  echo "Running Seed..."
  # Try running the v3 seed, falling back or just ensure compatibility
  if [ -f scripts/seed-data-extended-v3.ts ]; then
    npx tsx scripts/seed-data-extended-v3.ts
  elif [ -f prisma/seed.ts ]; then
    npx tsx prisma/seed.ts
  else
    echo "No seed file found!"
  fi
fi

# Start the application
exec node server.js
