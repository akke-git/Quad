# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sveltt Personal WebApp** is a Next.js application for managing personal home server services. It provides a dashboard for accessing various Docker services, a blog system, and a golf score management system.

## Key Commands

### Development
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks
- `npm run stop` - Kill process running on port 3000

### Environment
- Environment variables are stored in `.env.local`
- Required MySQL environment variables: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`

## Architecture

### Application Structure
- **Next.js Pages Router** architecture with pages in `/pages` directory
- **API Routes** in `/pages/api` for backend functionality
- **Database Layer** in `/lib/db.js` with dual MySQL connections (blog and golf)
- **Components** in `/components` directory for reusable UI elements

### Database Design
- Uses `serverless-mysql` for database connections
- Two database query functions: `query()` for blog data, `golfQuery()` for golf data
- Both functions use the same MySQL connection but separate query interfaces

### Main Features
1. **Home Dashboard** (`/pages/index.js`): Service cards with Docker configurations
2. **Blog System** (`/pages/blog/*`, `/pages/api/blog/*`): Content management
3. **Golf Management** (`/pages/golf/*`, `/pages/api/golf/*`): Score tracking and course management

### Styling
- **Tailwind CSS** for styling with dark theme (gray-900 background)
- **Custom fonts**: Ubuntu Mono (English), Nanum Gothic (Korean)
- **Color scheme**: Dark background with green-400 accent color
- **Mobile-first responsive design**

### Key Components
- `Navbar.js` - Main navigation
- `ServiceCard.js` - Home dashboard service cards
- `DockerConfigModal.js` - Modal for Docker configuration display
- `BlogPostCard.js` - Blog post cards
- `MarkdownEditor.js` - Blog content editor

## Development Notes

### Build Configuration
- TypeScript and ESLint errors are ignored during builds (`ignoreBuildErrors: true`)
- Image domains configured for localhost only
- React Strict Mode enabled

### API Structure
- Blog APIs handle CRUD operations, image uploads, and search
- Golf APIs manage courses, rounds, teams, users, and team matches
- File uploads stored in `/public/uploads/` directory

### Database Patterns
- All database queries use try/catch error handling
- Connection pooling handled by serverless-mysql
- Separate query functions maintain clean separation between blog and golf data

### File Organization
- Page components follow Next.js conventions
- API routes mirror page structure
- Static assets in `/public` directory
- Development documentation in `/public/dev_doc`