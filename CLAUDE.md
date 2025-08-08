# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a React Router v7 application deployed on Cloudflare Workers with the following stack:
- **Runtime**: Cloudflare Workers with Server-Side Rendering (SSR)
- **Frontend**: React 19 with React Router v7 for routing and data loading
- **Styling**: TailwindCSS v4 with Vite plugin integration
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Build Tool**: Vite with TypeScript
- **Deployment**: Wrangler CLI to Cloudflare Workers

## Key Commands

### Development
```bash
npm run dev              # Start development server with HMR at localhost:5173
npm run db:migrate       # Run database migrations locally
npm run typecheck        # Run TypeScript type checking with cf-typegen and react-router typegen
```

### Database Management
```bash
npm run db:generate      # Generate Drizzle schema migrations
npm run db:migrate       # Apply migrations to local D1 database
npm run db:migrate-production  # Apply migrations to production D1 database
```

### Build and Deploy
```bash
npm run build           # Build for production using react-router build
npm run deploy          # Build and deploy to Cloudflare Workers
npm run cf-typegen      # Generate Cloudflare Workers types
```

### Database Operations (via Wrangler CLI)
```bash
bun wrangler d1 execute DB --local --command "SELECT * FROM tableName;"     # Query local database
bun wrangler d1 execute DB --remote --command "SELECT * FROM tableName;"    # Query production database
```

## Architecture Details

### Database Layer
- **Schema**: `database/schema.ts` - Drizzle ORM schema definitions
- **Config**: `drizzle.config.ts` - Database configuration for D1 HTTP driver
- **Migrations**: `drizzle/` directory contains generated SQL migrations
- Current schema includes:
  - `guestBook` table with id, name, and email fields
  - `blogPosts` table with id, slug, title, body, and publishedDate (nullable for drafts)
  - `testPosts` table for development testing

### Application Structure
- **Entry Point**: `workers/app.ts` - Cloudflare Workers entry point with database injection
- **Server Entry**: `app/entry.server.tsx` - React Router server-side entry
- **Routes**: `app/routes/` - Manual route configuration in `app/routes.ts`
- **Root**: `app/root.tsx` - Application root component
- **Global Styles**: `app/global.css` - Global CSS styles

### Routing System
React Router v7 uses manual route configuration in `app/routes.ts`. Routes must be explicitly registered:
- Index route: `index("routes/home.tsx")` maps to `/`
- Static routes: `route("blog", "routes/blog.tsx")` maps to `/blog`
- Dynamic routes: `route("blog/:slug", "routes/blog.$slug.tsx")` maps to `/blog/hello-world`

### Data Loading Pattern
Routes use React Router's data loading with Cloudflare Workers context:
```typescript
export async function loader({ context }: Route.LoaderArgs) {
  // context.db provides access to Drizzle ORM instance
  // context.cloudflare provides access to env and ctx
}
```

### Blog System
- Blog posts support markdown content with basic parsing
- Published posts have non-null `publishedDate` (Unix timestamp)
- Draft posts have null `publishedDate` and are hidden from public routes
- Slug-based URLs for SEO-friendly permalinks

### Configuration Files
- **Wrangler**: `wrangler.jsonc` - Cloudflare Workers configuration with D1 binding
- **Vite**: `vite.config.ts` - Build configuration with Cloudflare, TailwindCSS, and React Router plugins
- **TypeScript**: Multiple tsconfig files for different environments (main, node, cloudflare)
- **React Router**: `react-router.config.ts` - SSR and prerendering configuration

## Development Notes

- The database requires proper setup in `wrangler.jsonc` and `drizzle.config.ts` with actual Cloudflare database IDs
- Environment variables needed: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_TOKEN`
- Run initial database migration before starting development
- TypeScript is configured for strict mode with Cloudflare Workers types
- The application uses React Router's new data loading patterns for SSR
- Use `bun wrangler` instead of just `wrangler` for CLI operations