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
- **E2E Testing**: Puppeteer + Jest

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
npm run test:e2e     # Run Puppeteer E2E tests
npm run test:e2e:headed  # Run E2E tests with visible browser
npm run test:e2e:debug   # Run E2E tests with slow motion
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
│   │   ├── progress/       # Weight history + chart
│   │   └── admin/          # Admin dashboard (admin-only)
│   ├── api/
│   │   ├── auth/login/     # POST login/register
│   │   ├── auth/logout/    # POST logout
│   │   ├── ocr/            # POST image → Claude Vision
│   │   ├── weights/        # CRUD weight entries
│   │   ├── activity/       # POST log progress views
│   │   └── admin/          # Admin API (users, activity logs)
│   └── page.tsx            # Landing page (redirects)
├── components/
│   ├── ui/                 # Button, Input, Card, Toast, Label, ConfirmModal
│   ├── layout/             # Header
│   └── features/
│       ├── achievements/   # AchievementBadge, AchievementsDisplay, AchievementUnlockedModal
│       ├── auth/           # LoginForm
│       ├── celebration/    # CelebrationModal, ShareButton, Confetti
│       ├── progress/       # WeightChart, WeightList, StatsSummary, GoalSetter, ShareProgress
│       ├── weekly-summary/ # WeeklySummaryModal
│       ├── upload/         # Dropzone, ImagePreview
│       ├── user/           # DisplayNameEditor
│       └── weight/         # WeightDisplay, WeightEdit
├── db/
│   ├── schema.ts           # Drizzle schema (users, weights, userPreferences, achievements, activityLog)
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
    ├── celebrations.ts     # Celebration triggers (milestones, goals)
    ├── weekly-summary.ts   # Weekly summary logic (7-day streak celebrations)
    └── admin.ts            # Admin username check
```

## Database Schema

- **users**: id, username, displayName, passwordHash, createdAt
- **weights**: id, userId, weight, unit (lb/kg), imageUrl, note, recordedAt, createdAt
- **userPreferences**: userId, preferredUnit, goalWeight
- **achievements**: id, userId, type, unlockedAt
- **activityLog**: id, userId, action (weight_logged/progress_viewed), metadata, createdAt

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

### Animations
The app uses Motion (framer-motion) for animations throughout:

**Custom CSS keyframes** (in `globals.css`):
- `float`: Gentle vertical bounce for unicorns
- `wiggle`: Rotation oscillation for header logo hover
- `bounce-soft`: Subtle scale animation
- `shine`: Gradient sweep for achievement badges
- `slide-up`, `fade-in`, `pulse-soft`: General utilities

**Component animations**:
- Stats cards: Staggered entrance (80ms between cards)
- Weight list: Items slide in from left (50ms stagger)
- Chart line: 800ms draw animation with ease-out
- Achievement badges: Subtle shine sweep on unlocked badges
- Progress page sections: Fade in on scroll (whileInView)
- Buttons: 2% scale press feedback via CSS `active:scale-[0.98]`
- Modals: Spring physics for entrance/exit

All animations respect `prefers-reduced-motion` media query.

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

### Run E2E tests
```bash
npm run dev                    # Dev server must be running
npm run test:e2e               # Run all E2E tests
npm run test:e2e:headed        # Run with visible browser
npm run test:e2e:debug         # Run with slow motion for debugging
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

### Weekly Summary
Every 7 days since the user's first weight entry, a Weekly Summary modal appears with:
- Week number (Week 1, Week 2, etc.)
- Number of entries logged that week
- Start/end weights with weekly change (if multiple entries exist)
- Personalized encouragement quote using the user's display name
- Different quote categories based on progress (good week, steady, challenging)

Triggers at 7, 14, 21, 28 days since first entry, regardless of logging consistency.

**Test with seed script:**
```bash
npx tsx scripts/seed-weekly-test.ts <username>
# Creates entries starting 8 days ago
# Then log one more weight to trigger the Week 1 summary modal
```

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

### Admin Mode
Admin dashboard at `/admin` for viewing all users and activity logs.

**Access**: Login with a username in the admin list (`src/lib/admin.ts`). Default: `spacemonkey`.

**Features**:
- View all registered users
- Filter activity by user
- Track weight logs and progress page views
- Delete users (with confirmation modal) - cascades to delete all associated data

**API Endpoints** (403 for non-admins):
- `GET /api/admin/users` - List all users
- `DELETE /api/admin/users/[id]` - Delete a user (cannot delete self)
- `GET /api/admin/activity?userId=` - List activity logs (optional user filter)

## E2E Testing

Comprehensive Puppeteer E2E test suite for regression testing.

### Test Structure

```
tests/e2e/
├── setup/
│   ├── browser.ts        # Browser launch, viewport helpers, delay()
│   ├── database.ts       # Direct SQLite helpers (create users, seed weights)
│   ├── test-data.ts      # Test fixtures and factories
│   └── mock-ocr.ts       # OCR mocking via sessionStorage
├── helpers/
│   ├── auth.helpers.ts   # Login, register, logout helpers
│   ├── navigation.helpers.ts  # Navigation utilities
│   └── selectors.ts      # Centralized data-testid selectors
└── suites/
    ├── auth.test.ts           # Registration, login, session, logout
    ├── weight-logging.test.ts # Upload, confirm, edit, save, delete
    ├── achievements.test.ts   # Achievement unlock tests
    ├── celebrations.test.ts   # Celebration modal tests
    ├── progress.test.ts       # Chart, stats, history, goal setting
    └── admin.test.ts          # Admin access, user management
```

### Key Patterns

**OCR Mocking**: Since OCR requires Claude Vision API, tests use sessionStorage bypass:
```typescript
await setPendingWeight(page, 175, "lb", "high");
await navigateTo(page, "/confirm");
```

**Database Seeding**: Direct SQLite access for test setup:
```typescript
const userId = await createTestUser(username, password);
await seedWeightEntries(userId, [
  { weight: 180, unit: "lb", daysAgo: 7 },
  { weight: 178, unit: "lb", daysAgo: 0 },
]);
```

**Selectors**: Uses `data-testid` attributes for reliable element selection. Key components have testids like `weight-display`, `save-button`, `weight-list-item`.

### Configuration

- **Timeout**: 60s per test (E2E tests need more time)
- **Serial Execution**: `maxWorkers: 1` to avoid database conflicts
- **Bail on Failure**: Stops on first failure in dev (not CI)
