# scale-bae

A weight tracking web app where users upload photos of their scale, and Claude Vision extracts the weight via OCR.

Follow guidlines here:
https://vercel.com/design/guidelines

## Tech Stack

- **Framework**: Next.js 16 with App Router, TypeScript
- **Styling**: Tailwind CSS v4 with custom feminine pink/lavender theme
- **Database**: SQLite with Drizzle ORM
- **Auth**: iron-session (cookie-based sessions)
- **OCR**: Claude Vision API (Anthropic SDK)
- **Charts**: Recharts
- **UI Primitives**: Radix UI (dialog, dropdown, toast, label)
- **Animations**: Motion (framer-motion)
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
│       ├── achievements/   # AchievementBadge, AchievementsDisplay, AchievementUnlockedModal
│       ├── auth/           # LoginForm
│       ├── celebration/    # CelebrationModal, ShareButton
│       ├── progress/       # WeightChart, WeightList, StatsSummary, GoalSetter, ShareProgress
│       ├── upload/         # Dropzone, ImagePreview
│       ├── user/           # DisplayNameEditor
│       └── weight/         # WeightDisplay, WeightEdit
├── db/
│   ├── schema.ts           # Drizzle schema (users, weights, userPreferences, achievements)
│   ├── index.ts            # Database connection
│   └── queries.ts          # Database query functions
├── services/
│   ├── auth.ts             # Session management (iron-session)
│   └── claude-vision.ts    # OCR with Claude Vision API
└── lib/
    ├── utils.ts            # cn() helper, formatRelativeDate
    ├── validations.ts      # Zod schemas
    ├── achievements.ts     # Achievement checking logic
    ├── achievement-types.ts # Achievement type definitions
    └── celebrations.ts     # Celebration triggers (milestones, goals)
```

## Database Schema

- **users**: id, username, displayName, passwordHash, createdAt
- **weights**: id, userId, weight, unit (lb/kg), imageUrl, note, recordedAt, createdAt
- **userPreferences**: userId, preferredUnit, goalWeight
- **achievements**: id, userId, type, unlockedAt

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

## Features

### Display Name
Users can set a custom display name (shown in header greeting and celebrations). Click the name in the header to edit.

### Achievements
Badge system that unlocks for milestones:
- First Steps (👣): First weigh-in
- Dedicated (📝): 10 entries
- Consistent (⭐): 30 entries
- Week Warrior (🔥): 7-day streak
- Goal Getter (🏆): Reach goal weight
- Down 5 (💪): Lose 5 kg
- Down 10 (🎯): Lose 10 kg

Achievements display in the progress page and show inline in weight history.

### Celebrations
Modal celebrations trigger for:
- Reaching goal weight
- New lowest weight
- Weight loss milestones (5kg, 10kg)

### Sharing
Web Share API integration for sharing progress (with fallback copy-to-clipboard).

### Unicorn Images
Custom unicorn illustrations used throughout:
- `public/unicorns/1-5.png`: General unicorns (loading states, dropzone, etc.)
- `public/unicorns/scales.png`: Current weight stat
- `public/unicorns/chart.png`: Change stat
- `public/unicorns/note.png`: Entries stat
- `public/unicorns/goal.png`: Goal progress stat

Images are optimized via Next.js Image component (automatic WebP conversion, caching).
