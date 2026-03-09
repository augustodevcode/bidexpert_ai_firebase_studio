@echo off
REM Start BidExpert server from worktree with correct env vars
cd /d E:\bw\aeh

set PORT=9007
set NODE_ENV=production
set DATABASE_URL=mysql://root:M%%21nh%%40S3nha2025@localhost:3306/bidexpert_demo
set ACTIVE_DATABASE_SYSTEM=MYSQL
set NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM=MYSQL
set SESSION_SECRET=e2e-test-secret-key-that-is-long-enough-for-iron-session-32chars!!
set AUTH_SECRET=e2e-auth-secret-key-long-enough-32chars-min!!
set AUTH_TRUST_HOST=true
set NEXTAUTH_URL=http://demo.localhost:9007
set NEXTAUTH_SECRET=e2e-nextauth-secret-key-long-32chars-min!!
set VERCEL=1
set NODE_OPTIONS=--max-old-space-size=4096

npx next start -p 9007
