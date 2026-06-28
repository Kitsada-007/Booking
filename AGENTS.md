# Project: Resort Management System

## Tech Stack
- Frontend: Next.js 14+ (React, TypeScript, Tailwind CSS)
- Backend: Node.js + Express (TypeScript), REST API, deployed as Vercel serverless functions
- Database: PostgreSQL + Prisma ORM
- Auth: JWT (access + refresh tokens), Google OAuth
- File Storage: Cloudinary or S3-compatible
- Email: Resend or Nodemailer (OTP, notifications)
- Maps: Google Maps API
- Payment: Omise / 2C2P gateway
- LINE: LINE Messaging API (notifications)
- Hosting: Vercel (frontend + backend)

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
- Type check: `npx tsc --noEmit` (in each package)

## Code Conventions
- TypeScript throughout — no `any`
- Functional React components with hooks (no class components)
- Named exports preferred (default exports only for pages)
- PascalCase: components, types, interfaces, classes
- camelCase: functions, variables, methods, files
- UPPER_CASE: constants (environment variables, config)
- Zod for all input validation
- Error responses: `{ error: string, code: string }` format
- Prisma for all database access — no raw SQL
- Colocate tests next to source: `feature.ts` → `feature.test.ts`

## Project Structure
```
vide-code/
├── frontend/           # Next.js application
│   └── src/
│       ├── app/        # App Router pages
│       ├── components/ # Shared UI components
│       └── lib/        # Utilities, API client
├── backend/            # Express API
│   ├── src/
│   │   ├── modules/    # Feature modules
│   │   └── common/     # Shared middleware
│   └── prisma/
│       └── schema.prisma
├── docs/
│   ├── spec/           # Specification
│   └── plan/           # Implementation plan
└── AGENTS.md
```

## Boundaries
- **Always do:** Type everything, run tests before commit, validate inputs with Zod, handle errors with proper HTTP status codes
- **Ask first:** Database schema changes, adding new dependencies, changing auth strategy, payment flow changes, deploying to production
- **Never do:** Commit secrets/credentials, disable type checking, skip error handling, make direct DB changes without migration

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
  try {
    const item = await prisma.item.create({ data: req.body });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create item', code: 'INTERNAL_ERROR' });
  }
});

export default router;
```

### Frontend Page Pattern
```typescript
'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  // ...
}
```
