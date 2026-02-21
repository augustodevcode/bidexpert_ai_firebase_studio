#!/bin/sh
set -e
apk add --no-cache openssl
npm install -g tsx
cp prisma/schema.postgresql.prisma prisma/schema.mysql.temp.prisma
sed -i 's/provider = "postgresql"/provider = "mysql"/g' prisma/schema.mysql.temp.prisma
npx prisma generate --schema=prisma/schema.mysql.temp.prisma
npx prisma db push --schema=prisma/schema.mysql.temp.prisma --accept-data-loss
/usr/local/bin/tsx scripts/ultimate-master-seed.ts
rm prisma/schema.mysql.temp.prisma
