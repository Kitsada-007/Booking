# Project: Resort Management System

## Tech Stack
- Frontend: Next.js 16.2.9 (React 19.2.4, TypeScript 5, Tailwind CSS 4)
- Backend: Express 5.2.1 + Prisma 7.8.0 + Zod 4.4.3 + TypeScript 6.0.3
- Database: PostgreSQL + Prisma 7 ORM (driver adapter: `@prisma/adapter-pg`)
- Auth: JWT dual-token (access + refresh), Google OAuth
- File Storage: Cloudinary or S3-compatible
- Email: Stubbed to console.log (OTP, notifications)
- Maps: OpenStreetMap embed (no API key required)
- Payment: Mock gateway + bank transfer (dual-path)
- LINE: LINE Messaging API (stubbed to console.log without env vars)
- Hosting: Vercel (frontend + backend as separate projects)

## Architecture Decisions
See `docs/decisions/` for ADRs on major choices:
- ADR-001: Decoupled monorepo (frontend/backend independent)
- ADR-002: PostgreSQL + Prisma 7 with driver adapter
- ADR-003: JWT dual-token auth + OTP password reset
- ADR-004: Express 5 on Vercel serverless
- ADR-005: Dual-path payment (gateway mock + bank transfer)
- ADR-006: Stubbed LINE notification service

## Commands
- Frontend dev: `cd frontend && npm run dev`
- Backend dev: `cd backend && npm run dev`
- Frontend build: `cd frontend && npm run build`
- Backend build: `cd backend && npm run build`
- Frontend lint: `cd frontend && npm run lint`
- Backend lint: `cd backend && npm run lint`
- DB migrate: `cd backend && npx prisma migrate dev`
- DB studio: `cd backend && npx prisma studio`
- DB seed: `cd backend && npx prisma db seed`
- Backend tests: `cd backend && npx vitest run`
- Type check: `npx tsc --noEmit` (in each package)

## Code Conventions
- TypeScript throughout — no `any`
- Functional React components with hooks (no class components)
- Named exports preferred (default exports only for pages)
- PascalCase: components, types, interfaces, classes
- camelCase: functions, variables, methods, files
- UPPER_CASE: constants (environment variables, config)
- Zod for all input validation (`import { z } from 'zod'`)
- Error responses: `{ error: string, code: string }` format
- Prisma for all database access — no raw SQL
- Colocate tests next to source: `feature.ts` → `feature.test.ts`

## Known Gotchas

### Express 5 async error handling
Express 5 automatically catches rejected promises from async route handlers and calls `next(err)`. Try/catch in route handlers is unnecessary but harmless. See ADR-004.

### Zod 4 API changes
- Use `z.flattenError()` (top-level function), not `result.error.flatten()` (deprecated method)
- Import as `import { z } from 'zod'` — named export pattern is consistent across the project
- `import { z, ZodSchema } from 'zod'` when both the namespace and type are needed

### React 19 state purity
- `Date.now()` in `useState` requires lazy initializer: `useState(() => Date.now())`
- `setState` calls must be after `await Promise.resolve()` in effect callbacks to avoid React 19 state purity warnings
- This pattern is used in all client component effects that set state after async work

### Next.js 16 params
- `params` and `searchParams` are `Promise<>` in Server Components — must be awaited
- `useSearchParams()` requires `<Suspense>` boundary — enforced at build time
- Our pages use either `useParams()` (client components) or `params: Promise<{...}>` (server components)

### Prisma 7 driver adapter
- Uses `@prisma/adapter-pg` with `pg` Pool instead of built-in connection pool
- v7 default `connectionTimeoutMillis: 0` (no timeout) — v6 was 5s
- Singleton pattern via `globalThis` for hot-reload safety
- See `backend/src/common/prisma.ts`

## Project Structure
```
vide-code/
├── frontend/           # Next.js application
│   └── src/
│       ├── app/        # App Router pages (35+ routes)
│       ├── components/ # Shared UI components (3)
│       └── lib/        # Utilities, API client, Auth context
├── backend/            # Express API
│   ├── src/
│   │   ├── modules/    # Feature modules (15 modules)
│   │   │   ├── auth/       # JWT auth + Google OAuth + OTP
│   │   │   ├── bookings/   # Room + boat booking service
│   │   │   ├── payments/   # Payment service (mock gateway)
│   │   │   ├── staff/      # Staff booking management
│   │   │   ├── reports/    # Room/boat/package reports
│   │   │   ├── schedules/  # Boat time slot CRUD
│   │   │   ├── packages/   # Room package CRUD
│   │   │   ├── notifications/ # LINE notification service
│   │   │   └── ...         # CRUD modules (room-types, rooms, etc.)
│   │   └── common/     # Shared middleware (validate, auth, prisma)
│   └── prisma/
│       └── schema.prisma  # 14 models
├── docs/
│   ├── decisions/      # Architecture Decision Records
│   ├── spec/           # Specification
│   └── plan/           # Implementation plan
└── AGENTS.md
```

## Boundaries
- **Always do:** Type everything, run tests before commit, validate inputs with Zod, handle errors with proper HTTP status codes
- **Ask first:** Database schema changes, adding new dependencies, changing auth strategy, payment flow changes, deploying to production, email provider configuration
- **Never do:** Commit secrets/credentials, disable type checking, skip error handling, make direct DB changes without migration, import from `@prisma/client` directly (use generated path)

## Implementation Order
Follow `docs/plan/implementation-plan.md` task by task. Each task has acceptance criteria and verification steps. Checkpoints after each phase require human review before proceeding.

## Patterns

### API Route Pattern
```typescript
import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../common/middleware/validate';
import { requireRole } from '../../common/middleware/auth';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1).max(100),
});

router.post('/', requireRole('admin'), validate(createSchema), async (req, res) => {
  const item = await prisma.item.create({ data: req.body });
  res.status(201).json(item);
});

export default router;
```

### Frontend Page Pattern
```typescript
'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      await Promise.resolve();
      try {
        const result = await apiClient.get<...>('/api/items');
        setItems(result.data);
      } catch { setError('Failed to load items'); }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (items.length === 0) return <div>No items found.</div>;
  // ...
}
```
