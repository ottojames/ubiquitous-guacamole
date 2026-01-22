# Technology Stack

**Analysis Date:** 2026-01-22

## Languages

**Primary:**
- TypeScript 5.8.3 - Full-stack (frontend, backend, scripts)

**Secondary:**
- JavaScript - Configuration files and tooling
- CSS - Styling via Tailwind

## Runtime

**Environment:**
- Node.js 20.x (`package.json` engines: `>= 18.18`)

**Package Manager:**
- npm - Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- React 19.1.0 - Frontend UI framework
- Express 4.19.2 - Backend API server (port 5174)
- Vite 7.0.4 - Frontend build tool and dev server (port 5173)

**UI Components & Styling:**
- Tailwind CSS 3.4.10 - Utility-first CSS framework
- Lucide React 0.536.0 - Icon library
- Framer Motion 12.23.12 - Animation library
- React Hook Form 7.62.0 - Form state management
- Radix UI (@radix-ui/react-popover 1.0.7) - Accessible component primitives

**Routing & State:**
- React Router DOM 7.9.6 - Frontend routing
- TanStack React Query 5.90.19 - Server state management and caching
- Zod 4.1.5 - Schema validation (TypeScript-first)

**Maps & Geospatial:**
- MapLibre GL 4.3.2 - Vector map rendering
- React Map GL 7.1.7 - React wrapper for MapLibre GL
- Supercluster 7.1.5 - Fast geospatial clustering

**File & Document Processing:**
- Multer 1.4.5-lts.2 - File upload handling
- PDF Parse 1.1.1 - PDF text extraction
- PDFJS Dist 4.5.4 - PDF.js library
- PDFKit 0.14.0 - PDF generation
- Tesseract.js 6.0.1 - OCR (Optical Character Recognition)
- Mammoth 1.10.0 - DOCX document parsing
- Textract 2.5.0 - Multi-format text extraction
- Sharp 0.33.4 - Image processing
- ADM-ZIP 0.5.16 - ZIP archive handling

**Data & Utilities:**
- Date-fns 4.1.0 - Date manipulation (preferred over dayjs)
- Dayjs 1.11.13 - Alternative date library (legacy)
- UUID 9.0.1 - UUID generation
- Slugify 1.6.6 - URL slug generation
- Lodash Debounce 4.0.8 - Debounce utility (shimmed)
- Fuse.js 7.1.0 - Fuzzy search library
- PapaParse 5.5.3 - CSV parsing
- QRCode 1.5.4 - QR code generation
- Lottie React 2.4.1 - Animation library support

**Form & Input:**
- React Dropzone 14.2.3 - Drag-and-drop file uploads

**Drag & Drop:**
- @dnd-kit/core 6.3.1 - Modern drag-and-drop library
- @dnd-kit/sortable 10.0.0 - Sortable lists
- @dnd-kit/utilities 3.2.2 - DnD utilities

## Testing

**Framework:**
- Vitest 1.6.0 - Test runner (config: `vitest.config.ts`)
- @vitest/coverage-v8 1.6.0 - Code coverage provider
- @testing-library/react 16.1.0 - React component testing utilities
- @testing-library/jest-dom 6.4.5 - DOM matchers
- @testing-library/user-event 14.4.3 - User interaction simulation
- jsdom 24.0.0 - DOM environment for tests

**E2E Testing:**
- @playwright/test 1.55.1 - E2E browser testing (primary, config: `playwright.config.ts`)
- Supertest 6.3.4 - HTTP assertion library
- Puppeteer 24.35.0 - Headless browser automation (legacy)

**Accessibility Testing:**
- @axe-core/playwright 4.11.0 - Automated accessibility testing with Playwright

## Build & Development Tools

**Bundling & Transpilation:**
- Vite 7.0.4 - Frontend bundler and dev server
- @vitejs/plugin-react 4.6.0 - React JSX support for Vite
- vite-plugin-node-polyfills 0.24.0 - Node.js polyfills for browser (buffer, process)
- TypeScript 5.8.3 - Type checking and compilation
- TSX 4.15.6 - Execute TypeScript directly (scripts)

**Linting & Formatting:**
- ESLint 9.30.1 (flat config format)
- @typescript-eslint/eslint-plugin 8.35.1 - TypeScript ESLint rules
- @typescript-eslint/parser 8.35.1 - TypeScript parser for ESLint
- eslint-plugin-react-hooks 5.2.0 - React Hooks rules
- eslint-plugin-react-refresh 0.4.20 - React Fast Refresh support
- ESLint Prettier config 9.1.0 - Prettier integration

**Code Style:**
- Prettier - Configuration: `eslint-config-prettier` integration (config file not specified but integrated)
- Autoprefixer 10.4.21 - CSS vendor prefixing
- PostCSS 8.5.6 - CSS transformation

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.46.0 - Database client (PostgreSQL + Auth + Storage)
- Stripe 20.2.0 - Payment processing (backend secret key)
- @stripe/stripe-js 8.6.3 - Payment processing (frontend publishable key)
- Resend 6.2.2 - Email delivery service
- Nodemailer 6.9.13 - Email client (alternative/legacy)
- OpenAI 6.3.0 - LLM API for AI summaries (optional)

**Security & Monitoring:**
- @sentry/react 10.22.0 - Frontend error tracking
- @sentry/node 10.22.0 - Backend error tracking
- Helmet 7.1.0 - Express security headers
- CORS 2.8.5 - Cross-Origin Resource Sharing middleware
- Bcrypt 6.0.0 - Password hashing
- Otplib 13.1.1 - OTP/TOTP for 2FA
- Speakeasy 2.0.0 - One-time password library

**Server Utilities:**
- Morgan 1.10.0 - HTTP request logging
- Express - Already listed in Frameworks

**HTTP Client:**
- Fetch API - Native (browser and Node.js 18+)

**Process Management:**
- Node-cron 4.2.1 - Scheduled tasks
- Cron 4.4.0 - Cron expression parser

**Utility & Support:**
- Busboy 1.6.0 - Multipart form parsing
- Dotenv 16.4.5 - Environment variable loading
- npm-run-all 4.1.5 - Run multiple npm scripts

## Configuration

**Environment:**
- `.env.example` - Template for required environment variables
- `.env` - Runtime environment (Git-ignored)
- `.env.development` - Development overrides
- `.env.local` - Local development secrets

**Key env vars required:**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Backend service role (server-side only)
- `SUPABASE_ANON_KEY` - Anonymous key for frontend auth
- `STRIPE_SECRET_KEY` - Stripe backend secret (test or live)
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe frontend publishable key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `RESEND_API_KEY` - Email service API key
- `VITE_SENTRY_DSN` - Frontend error tracking DSN
- `SENTRY_DSN` - Backend error tracking DSN

**Build:**
- `vite.config.ts` - Vite configuration (React plugin, API proxy to localhost:5174)
- `tsconfig.json` - TypeScript configuration (ES2020 target, strict mode, path alias `@/*` → `src/*`)
- `tsconfig.app.json` - App-specific TypeScript config
- `tsconfig.node.json` - Node-specific TypeScript config
- `eslint.config.js` - ESLint flat config (TypeScript, React, React Hooks)
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS plugins (Tailwind, Autoprefixer)
- `.nvmrc` - Node version lock (20)

**Optional configs:**
- `NEW_PUBLISH_FLOW` - Feature flag for new wizard publish flow (default: false)
- `ADDRESS_PROVIDER` - Address lookup provider (default: "mock", options: "getaddress", "mock")
- `POSTCODES_IO_URL` - Override postcodes.io endpoint (default: https://api.postcodes.io)
- `VITE_MAP_STYLE_URL` - MapTiler or compatible style URL (fallback to demotiles)
- `VITE_MAPTILER_KEY` - MapTiler API key for map styling

## Platform Requirements

**Development:**
- Node 20.x
- npm 10+ (compatible with lockfile v3)
- Git
- Optional: Docker (not in use)

**Ports (Local Development):**
- 5173 - Vite frontend dev server
- 5174 - Express API backend
- 5175 - Alternative API port (configurable via PORT env var)

**Production:**
- Node 20.x runtime
- Environment variables configured at deployment time
- Supabase database and storage buckets

## API Integration Points

**Backend Architecture:**
- REST API server (Express) with 30+ route modules
- API proxied through Vite dev server at `/api/*` to `localhost:5174`
- Health check endpoint: `GET /api/health`
- Swagger/OpenAPI documentation generated via `swagger-jsdoc`

---

*Stack analysis: 2026-01-22*
