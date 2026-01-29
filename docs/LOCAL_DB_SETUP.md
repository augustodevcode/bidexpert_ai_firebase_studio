# Local MySQL Setup (Development)

This project now uses a local MySQL by default for local development. We no longer depend on Locaweb-hosted databases for local development workflows.

Steps to setup a local MySQL for development:

1. Option A (Docker recommended):
   - Ensure Docker is installed and running
   - From the project root run:
     ```bash
     docker compose -f docker-compose.dev.yml up -d
     ```
   - Wait until the MySQL container is healthy (check `docker ps` / `docker logs bidexpert-mysql-dev`).

2. Option B (Native MySQL):
   - Install MySQL 8 (or MariaDB 10+)
   - Create databases: `bidexpert_dev`, `bidexpert_demo`, `bidexpert_prod`
   - Ensure a root user exists with password `password` (or change `.env` accordingly)

3. Configure environment variables
   - Edit `.env` and set:
     ```ini
     DATABASE_URL_DEV="mysql://root:password@localhost:3306/bidexpert_dev"
     DATABASE_URL="${DATABASE_URL_DEV}"
     DATABASE_URL_DEMO="mysql://root:password@localhost:3306/bidexpert_demo"
     ```

4. Apply Prisma schema and seed
   ```bash
   npx prisma db push
   npm run db:seed:ultimate
   ```

Notes:
- If you cannot use Docker, follow native MySQL installation steps for your OS.
- If you previously used Locaweb DBs, they are no longer required for local development. Production deployment still uses the configured production DB via CI/CD secrets.

If you hit a connection error (e.g., account locked), ensure your local MySQL is running and credentials in `.env` are correct.
