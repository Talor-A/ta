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

## Architecture Details

### Database Layer
- **Schema**: `database/schema.ts` - Drizzle ORM schema definitions
- **Config**: `drizzle.config.ts` - Database configuration for D1 HTTP driver
- **Migrations**: `drizzle/` directory contains generated SQL migrations
- Current schema includes a `guestBook` table with id, name, and email fields

### Application Structure
- **Entry Point**: `workers/app.ts` - Cloudflare Workers entry point
- **Server Entry**: `app/entry.server.tsx` - React Router server-side entry
- **Routes**: `app/routes/` - File-based routing with `home.tsx` as the main page
- **Root**: `app/root.tsx` - Application root component
- **Global Styles**: `app/global.css` - Global CSS styles

### Configuration Files
- **Wrangler**: `wrangler.jsonc` - Cloudflare Workers configuration with D1 binding
- **Vite**: `vite.config.ts` - Build configuration with Cloudflare, TailwindCSS, and React Router plugins
- **TypeScript**: Multiple tsconfig files for different environments (main, node, cloudflare)

## Development Notes

- The database requires proper setup in `wrangler.jsonc` and `drizzle.config.ts` with actual Cloudflare database IDs
- Environment variables needed: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_TOKEN`
- Run initial database migration before starting development
- TypeScript is configured for strict mode with Cloudflare Workers types
- The application uses React Router's new data loading patterns for SSR