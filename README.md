# Comic Platform V2

Next.js MVP + PostgreSQL schema + source adapter.

## Run
1. `docker compose up -d`
2. Copy `.env.example` to `.env.local`
3. Create the DB schema:
   `psql "$DATABASE_URL" -f db/schema.sql`
4. `npm install`
5. `npm run dev`

## Source coverage
The adapter covers the documented public endpoints for latest/library pagination,
popular by type, colored, genres, genre pagination, search, detail, and chapter.
The public API documentation lists these endpoint families. See:
https://github.com/VernSG/Komiku-Rest-Api

## Important
This version separates source access from the database. It does not automatically
bulk-mirror third-party comic images/content. Implement ingestion only where you
have permission/authorization to use the source and content.
