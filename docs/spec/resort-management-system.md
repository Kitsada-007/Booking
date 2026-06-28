# Spec: Resort Management System

## Objective

Build a complete management system for a Thai resort that handles room booking, boat tour booking, package deals, and payment processing. The system serves 5 user roles (admin, room staff, boat staff, guests, members) with role-specific dashboards, reporting, and Google Maps integration.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+ (React, TypeScript, Tailwind CSS) |
| Backend | Node.js + Express (TypeScript), REST API (deployed as Vercel serverless functions) |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (access + refresh tokens), Google OAuth |
| File Storage | Cloudinary or S3-compatible (images, payment slips) |
| Email | Resend or Nodemailer (OTP, notifications) |
| Maps | Google Maps API (pin drops, coordinates) |
| Payment | Omise / 2C2P gateway |
| LINE | LINE Messaging API (notifications) |
| Hosting | Vercel (frontend + backend as serverless functions) |

## Commands

```bash
# Frontend (Next.js)
dev:        npm run dev
build:      npm run build
lint:       npm run lint
test:       npm run test

# Backend
dev:        npm run dev
build:      npm run build
lint:       npm run lint
test:       npm run test
db:migrate: npx prisma migrate dev
db:seed:    npx prisma db seed
db:studio:  npx prisma studio
```

## Project Structure

```
vide-code/
├── frontend/                  # Next.js application
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   ├── components/       # Shared UI components
│   │   ├── lib/              # Utilities, API client
│   │   ├── hooks/            # Custom React hooks
│   │   └── types/            # TypeScript types
│   ├── public/               # Static assets
│   └── package.json
├── backend/                   # Express/NestJS API
│   ├── src/
│   │   ├── modules/          # Feature modules (auth, rooms, boats, booking, payment, reports)
│   │   ├── common/           # Shared middleware, guards, interceptors
│   │   ├── prisma/           # Prisma schema + migrations
│   │   └── main.ts           # Entry point
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
├── docs/
│   ├── spec/                 # Spec documents
│   └── ideas/                # Idea refinement artifacts
└── README.md
```

## Code Style

TypeScript throughout. Functional components with hooks. PascalCase for components and types, camelCase for functions and variables.

```typescript
// Component example
export default function RoomCard({ room }: { room: Room }) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-lg font-semibold">{room.name}</h3>
      <p className="text-gray-600">{room.price.toLocaleString()} ฿</p>
    </div>
  );
}

// API route example
export async function GET(req: NextRequest) {
  const rooms = await prisma.room.findMany();
  return NextResponse.json(rooms);
}
```

## Testing Strategy

| Layer | Tool | Scope |
|-------|------|-------|
| Unit | Vitest | Pure functions, utilities, validation |
| Integration | Vitest + Supertest | API endpoints, database queries |
| E2E | Playwright | Critical user flows (booking, payment) |

Coverage target: 70%+ for business logic. Tests live in `__tests__/` next to source files.

## Boundaries

- **Always do:** Type everything (no `any`), run tests before commit, validate all inputs with Zod, handle errors with proper status codes
- **Ask first:** Database schema changes, adding new dependencies, changing auth strategy, payment flow changes, deploying to production
- **Never do:** Commit secrets/credentials, disable type checking, skip error handling, make direct DB changes without migration

## Success Criteria

### Must Have (v1.0)
- [ ] All 5 user roles can log in with email/password (admin/staff) or email/Google (members)
- [ ] OTP password reset via email works
- [ ] Admin can CRUD: staff accounts, room types, rooms, boat types, boats, bank accounts
- [ ] Room staff can manage room bookings, packages, check-in/out, contact info
- [ ] Boat staff can manage boat schedules, time slots, bookings, contact info
- [ ] Guests can view rooms/boats on public site with Google Maps
- [ ] Members can register, book rooms, book boats, upload payment slips, review
- [ ] Payments integrate with Omise/2C2P gateway
- [ ] Reports (daily/monthly) for bookings, cancellations, revenue, occupancy
- [ ] LINE notifications for booking confirmations

### Nice to Have (v1.1+)
- [ ] Multi-language support (Thai/English)
- [ ] Real-time booking availability via WebSocket
- [ ] Mobile-responsive PWA

## Open Questions

1. Exact backend framework preference — Express vs NestJS?
2. Omise or 2C2P specifically? (Omise has better DX but 2C2P is more common in Thai resorts)
3. LINE login, or just LINE notifications?
4. Google Maps API key — client provides or we set up?
5. Deployment target for backend? (VPS in Thailand, Vercel serverless, Railway?)
6. Email service preference for OTP?
