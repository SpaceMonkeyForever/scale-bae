# scale-bae

A weight tracking web app where users upload photos of their scale, and Claude Vision extracts the weight via OCR.

## Tech Stack

- **Framework**: Next.js 16 with App Router, TypeScript
- **Styling**: Tailwind CSS v4 with custom feminine pink/lavender theme
- **Database**: SQLite with Drizzle ORM
- **Auth**: iron-session (cookie-based sessions)
- **OCR**: Claude Vision API (Anthropic SDK)
- **Charts**: Recharts
- **UI Primitives**: Radix UI (dialog, dropdown, toast, label)
- **Visual Testing**: Puppeteer + jest-image-snapshot

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Drizzle migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio (database GUI)
npm run test:visual  # Run Puppeteer visual tests
npm run view         # Open app in Puppeteer and take screenshots
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/       # Login page (public)
│   ├── (protected)/        # Auth-required pages
│   │   ├── layout.tsx      # Auth check + header
│   │   ├── upload/         # Photo upload page
│   │   ├── confirm/        # Weight confirmation page
│   │   └── progress/       # Weight history + chart
│   ├── api/
│   │   ├── auth/login/     # POST login/register
│   │   ├── auth/logout/    # POST logout
│   │   ├── ocr/            # POST image → Claude Vision
│   │   └── weights/        # CRUD weight entries
│   └── page.tsx            # Landing page (redirects)
├── components/
│   ├── ui/                 # Button, Input, Card, Toast, Label
│   ├── layout/             # Header
│   └── features/
│       ├── auth/           # LoginForm
│       ├── upload/         # Dropzone, ImagePreview
│       ├── weight/         # WeightDisplay, WeightEdit
│       └── progress/       # WeightChart, WeightList, StatsSummary
├── db/
│   ├── schema.ts           # Drizzle schema (users, weights, userPreferences)
│   ├── index.ts            # Database connection
│   └── queries.ts          # Database query functions
├── services/
│   ├── auth.ts             # Session management (iron-session)
│   └── claude-vision.ts    # OCR with Claude Vision API
└── lib/
    ├── utils.ts            # cn() helper for classnames
    └── validations.ts      # Zod schemas
```

## Database Schema

- **users**: id, username, passwordHash, createdAt
- **weights**: id, userId, weight, unit (lb/kg), imageUrl, note, recordedAt, createdAt
- **userPreferences**: userId, preferredUnit, goalWeight

## Environment Variables

```env
ANTHROPIC_API_KEY=sk-ant-...     # Required for OCR
SESSION_SECRET=32-char-secret    # Required for auth
COOKIE_SECURE=true               # Set in production with HTTPS
```

## Key Implementation Details

### Auth Flow
- No middleware (better-sqlite3 doesn't work in Edge runtime)
- Auth check happens in `(protected)/layout.tsx` server component
- Uses `redirect()` if not logged in

### OCR Flow
1. User uploads image to `/upload`
2. Image converted to base64, sent to `/api/ocr`
3. Claude Vision extracts weight, returns `{ weight, unit, confidence }`
4. User confirms on `/confirm` page
5. Weight saved via `/api/weights`

### Theme
Custom colors defined in `globals.css` using Tailwind v4's `@theme inline`:
- `bae-*`: Pink shades (primary)
- `lavender-*`: Purple shades (accent)
- `mint-*`: Green shades (success)

## Common Tasks

### Add a new API route
Create `src/app/api/[route]/route.ts` with GET/POST/etc handlers.

### Add a new protected page
Create `src/app/(protected)/[page]/page.tsx` - auth is handled by parent layout.

### Modify database schema
1. Edit `src/db/schema.ts`
2. Run `npm run db:generate`
3. Run `npm run db:push`

### Test visually
```bash
npm run dev                    # In one terminal
npm run view                   # Takes screenshots
npm run test:visual            # Runs visual regression tests
```
