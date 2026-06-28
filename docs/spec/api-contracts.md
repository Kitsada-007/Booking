# API Contracts: Resort Management System

## Conventions

- Base URL: `/api`
- All endpoints prefix with `/api`
- Error responses follow `{ error: string, code: string, details?: unknown }`
- List endpoints support pagination: `?page=1&pageSize=20`
- All mutations require JWT in `Authorization: Bearer <token>` header
- Role middleware: `requireRole('admin', 'room_staff', 'boat_staff')`

## Error Codes

| Status | Code | Meaning |
|--------|------|---------|
| 400 | `VALIDATION_ERROR` | Invalid input data |
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 403 | `FORBIDDEN` | Insufficient role |
| 404 | `NOT_FOUND` | Resource doesn't exist |
| 409 | `CONFLICT` | Duplicate or state conflict |
| 500 | `INTERNAL_ERROR` | Server error |

---

## Auth

### POST /api/auth/register

```typescript
// Input
{
  email: string;        // unique
  password: string;     // min 8 chars
  firstName: string;
  lastName: string;
  phone: string;        // unique
  lineId?: string;
  facebook?: string;
}

// Output 201
{
  user: User,
  accessToken: string,
  refreshToken: string
}
```

### POST /api/auth/login

```typescript
// Input
{
  email: string;
  password: string;
}

// Output 200
{
  user: User,
  accessToken: string,
  refreshToken: string
}
```

### POST /api/auth/google

```typescript
// Input
{
  googleToken: string;
}

// Output 200
{
  user: User,
  accessToken: string,
  refreshToken: string
}
```

### POST /api/auth/refresh

```typescript
// Input
{
  refreshToken: string;
}

// Output 200
{
  accessToken: string,
  refreshToken: string
}
```

### POST /api/auth/forgot-password

```typescript
// Input
{
  email: string;
}

// Output 200
{
  message: 'OTP sent to email'
}
```

### POST /api/auth/reset-password

```typescript
// Input
{
  email: string;
  otp: string;
  newPassword: string;
}

// Output 200
{
  message: 'Password updated'
}
```

---

## Users

### GET /api/users (admin)

List all staff users. Paginated.

```typescript
// Query
{
  page?: number;
  pageSize?: number;
  role?: 'admin' | 'room_staff' | 'boat_staff';
  status?: 'active' | 'inactive';
}

// Output 200
{
  data: User[],
  pagination: { page, pageSize, totalItems, totalPages }
}
```

### POST /api/users (admin)

Create staff account.

```typescript
// Input
{
  email: string;
  password: string;
  role: 'room_staff' | 'boat_staff';
  status: 'active' | 'inactive';
}

// Output 201: User
```

### PATCH /api/users/:id (admin)

Update staff status/role.

```typescript
// Input
{
  status?: 'active' | 'inactive';
  role?: 'room_staff' | 'boat_staff';
}

// Output 200: User
```

### GET /api/users/me

Get current user profile.

```typescript
// Output 200: User
```

### PATCH /api/users/me

Update own profile.

```typescript
// Input
{
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  lineId?: string;
  facebook?: string;
  profileImage?: string;
}

// Output 200: User
```

### PATCH /api/users/me/password

Change own password.

```typescript
// Input
{
  currentPassword: string;
  newPassword: string;
}

// Output 200
{
  message: 'Password updated'
}
```

---

## Room Types

### GET /api/room-types (public)

```typescript
// Query
{
  checkIn?: string;    // ISO date — filters by availability
  page?: number;
  pageSize?: number;
}

// Output 200
{
  data: RoomType[],
  pagination: { page, pageSize, totalItems, totalPages }
}
```

### GET /api/room-types/:id (public)

```typescript
// Output 200: RoomType (includes reviews, images)
```

### POST /api/room-types (admin)

```typescript
// Input (multipart/form-data)
{
  name: string;
  price: number;
  capacity: number;
  amenities: {
    hasAircon: boolean;
    bedSize: string;
    bedCount: number;
    hasTv: boolean;
  };
  description?: string;
  images: File[];       // max 5, .jpg/.png
}

// Output 201: RoomType
```

### PATCH /api/room-types/:id (admin)

```typescript
// Input (multipart/form-data, partial)
{
  name?: string;
  price?: number;
  capacity?: number;
  amenities?: { ... };
  description?: string;
  images?: File[];
}

// Output 200: RoomType
```

### DELETE /api/room-types/:id (admin)

```typescript
// Output 204 (only if no active rooms of this type)
```

---

## Rooms

### GET /api/rooms (admin)

```typescript
// Query
{
  roomTypeId?: string;
  status?: 'available' | 'occupied' | 'maintenance';
}

// Output 200: Room[]
```

### POST /api/rooms (admin)

```typescript
// Input
{
  roomNumber: string;
  roomTypeId: string;
  description?: string;
}

// Output 201: Room
```

### PATCH /api/rooms/:id (admin)

```typescript
// Input (partial)
{
  roomNumber?: string;
  roomTypeId?: string;
  status?: 'available' | 'occupied' | 'maintenance';
  description?: string;
}

// Output 200: Room
```

### DELETE /api/rooms/:id (admin)

```typescript
// Output 204 (only if no active bookings)
```

---

## Boat Types

### GET /api/boat-types (public)

```typescript
// Output 200
{
  data: BoatType[],
  pagination: { page, pageSize, totalItems, totalPages }
}
```

### GET /api/boat-types/:id (public)

```typescript
// Output 200: BoatType
```

### POST /api/boat-types (admin)

```typescript
// Input (multipart/form-data)
{
  name: string;
  capacity: number;
  seats: number;
  price: number;
  durationMinutes: number;
  images: File[];       // max 2, .jpg/.png
}

// Output 201: BoatType
```

### PATCH /api/boat-types/:id (admin)

```typescript
// Input (multipart/form-data, partial)
{
  name?: string;
  capacity?: number;
  seats?: number;
  price?: number;
  durationMinutes?: number;
  images?: File[];
}

// Output 200: BoatType
```

### DELETE /api/boat-types/:id (admin)

```typescript
// Output 204 (only if no active boats of this type)
```

---

## Boats

### GET /api/boats (admin)

```typescript
// Query
{
  boatTypeId?: string;
}

// Output 200: Boat[]
```

### POST /api/boats (admin)

```typescript
// Input
{
  boatNumber: string;
  boatTypeId: string;
}

// Output 201: Boat
```

### PATCH /api/boats/:id (admin)

```typescript
// Input (partial)
{
  boatNumber?: string;
  boatTypeId?: string;
}

// Output 200: Boat
```

### DELETE /api/boats/:id (admin)

```typescript
// Output 204 (only if no active bookings)
```

---

## Boat Schedules (boat_staff)

### GET /api/schedules

```typescript
// Query
{
  date?: string;    // ISO date
  boatTypeId?: string;
}

// Output 200: TimeSlot[]
```

### POST /api/schedules

```typescript
// Input
{
  startTime: string;     // "08:00"
  endTime: string;       // "09:00"
  maxBookings: number;
  boatTypeId: string;
}

// Output 201: TimeSlot
```

### PATCH /api/schedules/:id

```typescript
// Input (partial)
{
  startTime?: string;
  endTime?: string;
  maxBookings?: number;
  boatTypeId?: string;
}

// Output 200: TimeSlot
```

### DELETE /api/schedules/:id

```typescript
// Output 204
```

### PATCH /api/settings/boat-hours

```typescript
// Input
{
  openTime: string;     // "08:00"
  closeTime: string;    // "17:00"
}

// Output 200: BoatHours
```

---

## Room Bookings (member)

### POST /api/bookings/rooms

```typescript
// Input
{
  roomTypeId: string;
  checkIn: string;          // ISO date
  checkOut: string;         // ISO date
  quantity: number;         // number of rooms
  guestCount: number;
  packageId?: string;       // optional package
  paymentMethod: 'gateway' | 'bank_transfer';
}

// Output 201
{
  booking: RoomBooking,
  payment: PaymentInfo     // includes QR/total for bank transfer, or redirect URL for gateway
}
```

### GET /api/bookings/rooms (member)

```typescript
// Query
{
  status?: 'pending_payment' | 'confirmed' | 'cancelled' | 'completed';
  page?: number;
  pageSize?: number;
}

// Output 200
{
  data: RoomBooking[],
  pagination: { page, pageSize, totalItems, totalPages }
}
```

### GET /api/bookings/rooms/:id (member)

```typescript
// Output 200: RoomBooking (includes payment slip URL if any)
```

### PATCH /api/bookings/rooms/:id/cancel (member)

```typescript
// Input
{
  // only allowed if status is pending_payment
}

// Output 200: RoomBooking (status → cancelled)
```

---

## Boat Bookings (member)

### GET /api/bookings/boats/availability

```typescript
// Query
{
  date: string;        // ISO date
  boatTypeId?: string;
}

// Output 200
{
  date: string,
  slots: {
    timeSlotId: string;
    startTime: string;
    endTime: string;
    boatType: BoatType;
    availableBookings: number;
    maxBookings: number;
  }[]
}
```

### POST /api/bookings/boats

```typescript
// Input
{
  date: string;
  timeSlotId: string;
  boatTypeId: string;
  boatCount: number;
  guestCount: number;
  paymentMethod: 'gateway' | 'bank_transfer';
}

// Output 201
{
  booking: BoatBooking,
  payment: PaymentInfo
}
```

### GET /api/bookings/boats (member)

```typescript
// Query
{
  status?: 'pending_payment' | 'confirmed' | 'cancelled' | 'completed';
  page?: number;
  pageSize?: number;
}

// Output 200
{
  data: BoatBooking[],
  pagination: { page, pageSize, totalItems, totalPages }
}
```

### GET /api/bookings/boats/:id (member)

```typescript
// Output 200: BoatBooking
```

### PATCH /api/bookings/boats/:id/cancel (member)

```typescript
// Output 200: BoatBooking (status → cancelled, only if pending_payment)
```

---

## Staff Booking Management

### GET /api/staff/room-bookings (room_staff)

```typescript
// Query
{
  status?: 'pending_payment' | 'confirmed' | 'cancelled' | 'completed';
  dateFrom?: string;
  dateTo?: string;
  search?: string;          // search by member name
  page?: number;
  pageSize?: number;
}

// Output 200
{
  data: RoomBooking[],
  pagination: { page, pageSize, totalItems, totalPages }
}
```

### PATCH /api/staff/room-bookings/:id/status (room_staff)

```typescript
// Input
{
  status: 'confirmed' | 'completed' | 'cancelled';
  // ─────────────────────────────────────────────
  // Allowed transitions:
  // pending_payment → confirmed (after payment verified)
  // confirmed → completed (check-out)
  // confirmed → cancelled (with reason)
  // pending_payment → cancelled
}

// Output 200: RoomBooking
```

### GET /api/staff/boat-bookings (boat_staff)

```typescript
// Query
{
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// Output 200
{
  data: BoatBooking[],
  pagination: { page, pageSize, totalItems, totalPages }
}
```

### PATCH /api/staff/boat-bookings/:id/status (boat_staff)

```typescript
// Input
{
  status: 'confirmed' | 'completed' | 'cancelled';
}

// Output 200: BoatBooking
```

---

## Payment

### POST /api/payments/slip (member + staff)

Upload payment slip for bank transfer bookings.

```typescript
// Input (multipart/form-data)
{
  bookingId: string;
  bookingType: 'room' | 'boat';
  slipImage: File;     // .jpg/.png
}

// Output 200
{
  message: 'Slip uploaded, pending verification',
  payment: Payment
}
```

### GET /api/payments/:bookingId (member + staff)

```typescript
// Query
{
  bookingType: 'room' | 'boat';
}

// Output 200: Payment (includes slip URL, status, amount)
```

### PATCH /api/payments/:id/verify (staff)

Verify payment (mark as paid).

```typescript
// Input
{
  verified: boolean;     // true = approve, false = reject
}

// Output 200: Payment
```

---

## Packages

### GET /api/packages (public)

```typescript
// Output 200
{
  data: Package[]
}
```

### GET /api/packages/:id (public)

```typescript
// Output 200: Package
```

### POST /api/packages (room_staff)

```typescript
// Input
{
  name: string;
  roomTypeId: string;
  roomQuantity: number;
  price: number;
  startDate: string;      // ISO date
  endDate: string;        // ISO date
  details?: string;
}

// Output 201: Package
```

### PATCH /api/packages/:id (room_staff)

```typescript
// Input (partial)
{
  name?: string;
  price?: number;
  startDate?: string;
  endDate?: string;
  details?: string;
}

// Output 200: Package
```

### DELETE /api/packages/:id (room_staff)

```typescript
// Output 204
```

---

## Reviews

### GET /api/reviews (public)

```typescript
// Query
{
  roomTypeId?: string;
  page?: number;
  pageSize?: number;
}

// Output 200
{
  data: Review[],
  pagination: { page, pageSize, totalItems, totalPages },
  summary: {
    averageRating: number;
    totalReviews: number;
  }
}
```

### POST /api/reviews (member)

```typescript
// Input
{
  roomTypeId: string;
  bookingId: string;       // must be a completed booking
  rating: number;          // 1-5
  comment?: string;
}

// Output 201: Review
```

---

## Reports

### GET /api/reports/rooms (admin, room_staff)

```typescript
// Query
{
  type: 'daily' | 'monthly';
  date?: string;           // ISO date for daily
  month?: string;          // "2026-06" for monthly
}

// Output 200
{
  type: 'daily' | 'monthly',
  period: { start: string, end: string },
  bookings: { total, cancelled, completed },
  payments: { total, pending, verified },
  revenue: number,
  occupancy?: {             // daily only
    available: number,
    booked: number,
    date: string
  }[]
}
```

### GET /api/reports/boats (admin, boat_staff)

```typescript
// Query
{
  type: 'daily' | 'monthly';
  date?: string;
  month?: string;
}

// Output 200
{
  type: 'daily' | 'monthly',
  period: { start, end },
  bookings: { total, cancelled, completed },
  payments: { total, pending, verified },
  revenue: number,
  availability?: {
    date: string;
    timeSlot: string;
    boatType: string;
    total: number;
    booked: number;
    available: number;
  }[]
}
```

### GET /api/reports/packages (admin)

```typescript
// Query
{
  dateFrom?: string;
  dateTo?: string;
}

// Output 200
{
  packages: {
    name: string;
    bookingCount: number;
    totalRevenue: number;
    peakPeriod: string;
  }[],
  summary: {
    totalBookings: number;
    totalRevenue: number;
  }
}
```

---

## Settings

### GET /api/settings (public)

Get resort contact info.

```typescript
// Output 200
{
  name: string;
  address: string;
  coordinates: { lat: number, lng: number };
  phone: string;
  email: string;
  facebook: string;
  line: string;
  businessHours: string;
  terms?: string;
}
```

### PATCH /api/settings (admin, room_staff, boat_staff)

Update resort info (role-appropriate fields).

```typescript
// Input (partial)
{
  name?: string;
  address?: string;
  coordinates?: { lat: number, lng: number };
  phone?: string;
  email?: string;
  facebook?: string;
  line?: string;
  businessHours?: string;
  terms?: string;
}

// Output 200: Settings
```

### GET /api/settings/bank-accounts (admin)

```typescript
// Output 200: BankAccount[]
```

### POST /api/settings/bank-accounts (admin)

```typescript
// Input
{
  bankName: string;
  accountName: string;
  accountNumber: string;
}

// Output 201: BankAccount
```

### DELETE /api/settings/bank-accounts/:id (admin)

```typescript
// Output 204
```

---

## Shared Types

```typescript
// ─── Enums ───
enum UserRole { Admin = 'admin', RoomStaff = 'room_staff', BoatStaff = 'boat_staff', Member = 'member' }
enum BookingStatus { PendingPayment = 'pending_payment', Confirmed = 'confirmed', Cancelled = 'cancelled', Completed = 'completed' }
enum PaymentMethod { Gateway = 'gateway', BankTransfer = 'bank_transfer' }
enum PaymentStatus { Pending = 'pending', Verified = 'verified', Rejected = 'rejected' }

// ─── Entities ───
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address?: string;
  profileImage?: string;
  role: UserRole;
  status: 'active' | 'inactive';
  lineId?: string;
  facebook?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RoomType {
  id: string;
  name: string;
  price: number;
  capacity: number;
  amenities: { hasAircon: boolean; bedSize: string; bedCount: number; hasTv: boolean };
  description?: string;
  images: string[];
  avgRating?: number;
  reviewCount?: number;
  createdAt: Date;
}

interface Room {
  id: string;
  roomNumber: string;
  roomTypeId: string;
  roomType: RoomType;
  status: 'available' | 'occupied' | 'maintenance';
  description?: string;
}

interface BoatType {
  id: string;
  name: string;
  capacity: number;
  seats: number;
  price: number;
  durationMinutes: number;
  images: string[];
  createdAt: Date;
}

interface Boat {
  id: string;
  boatNumber: string;
  boatTypeId: string;
  boatType: BoatType;
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  maxBookings: number;
  boatTypeId: string;
  availableBookings: number;   // computed at query time
}

interface RoomBooking {
  id: string;
  userId: string;
  roomTypeId: string;
  roomType: RoomType;
  checkIn: Date;
  checkOut: Date;
  quantity: number;
  guestCount: number;
  totalPrice: number;
  status: BookingStatus;
  payment: Payment;
  packageId?: string;
  createdAt: Date;
}

interface BoatBooking {
  id: string;
  userId: string;
  boatTypeId: string;
  boatType: BoatType;
  timeSlotId: string;
  date: Date;
  boatCount: number;
  guestCount: number;
  totalPrice: number;
  status: BookingStatus;
  payment: Payment;
  createdAt: Date;
}

interface Payment {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  slipUrl?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  createdAt: Date;
}

interface Review {
  id: string;
  userId: string;
  userName: string;
  roomTypeId: string;
  bookingId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

interface Package {
  id: string;
  name: string;
  roomTypeId: string;
  roomQuantity: number;
  price: number;
  startDate: Date;
  endDate: Date;
  details?: string;
  roomType?: RoomType;
  isActive: boolean;     // computed: now between startDate and endDate
}

interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  isActive: boolean;
}
```
