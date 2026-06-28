import { prisma } from '../../common/prisma';

export async function getRoomDailyReport(dateFrom: string, dateTo: string) {
  const start = new Date(dateFrom);
  const end = new Date(dateTo);

  const bookings = await prisma.roomBooking.findMany({
    where: { createdAt: { gte: start, lte: end } },
    select: { createdAt: true, totalPrice: true, status: true },
    orderBy: { createdAt: 'asc' },
  });

  const dailyMap = new Map<string, { bookings: number; cancelled: number; revenue: number; pending: number; confirmed: number }>();

  for (const b of bookings) {
    const day = b.createdAt.toISOString().slice(0, 10);
    const entry = dailyMap.get(day) || { bookings: 0, cancelled: 0, revenue: 0, pending: 0, confirmed: 0 };
    entry.bookings += 1;
    entry.revenue += b.totalPrice;
    if (b.status === 'cancelled') entry.cancelled += 1;
    if (b.status === 'pending_payment') entry.pending += 1;
    if (b.status === 'confirmed' || b.status === 'completed') entry.confirmed += 1;
    dailyMap.set(day, entry);
  }

  const days: { date: string; bookings: number; cancelled: number; revenue: number; pending: number; confirmed: number }[] = [];
  const current = new Date(start);
  while (current <= end) {
    const day = current.toISOString().slice(0, 10);
    days.push({ date: day, ...dailyMap.get(day) || { bookings: 0, cancelled: 0, revenue: 0, pending: 0, confirmed: 0 } });
    current.setDate(current.getDate() + 1);
  }

  return days;
}

export async function getRoomMonthlyReport(year: number) {
  const start = new Date(`${year}-01-01`);
  const end = new Date(`${year + 1}-01-01`);

  const bookings = await prisma.roomBooking.findMany({
    where: { createdAt: { gte: start, lt: end } },
    select: { createdAt: true, totalPrice: true, status: true },
    orderBy: { createdAt: 'asc' },
  });

  const monthlyMap = new Map<string, { bookings: number; cancelled: number; revenue: number }>();

  for (const b of bookings) {
    const month = `${b.createdAt.getFullYear()}-${String(b.createdAt.getMonth() + 1).padStart(2, '0')}`;
    const entry = monthlyMap.get(month) || { bookings: 0, cancelled: 0, revenue: 0 };
    entry.bookings += 1;
    entry.revenue += b.totalPrice;
    if (b.status === 'cancelled') entry.cancelled += 1;
    monthlyMap.set(month, entry);
  }

  const months: { month: string; bookings: number; cancelled: number; revenue: number }[] = [];
  for (let m = 0; m < 12; m++) {
    const month = `${year}-${String(m + 1).padStart(2, '0')}`;
    months.push({ month, ...monthlyMap.get(month) || { bookings: 0, cancelled: 0, revenue: 0 } });
  }

  return months;
}

export async function getRoomOccupancyReport(dateFrom: string, dateTo: string) {
  const start = new Date(dateFrom);
  const end = new Date(dateTo);

  const roomTypes = await prisma.roomType.findMany({
    include: { _count: { select: { rooms: true } } },
  });

  const bookings = await prisma.roomBooking.findMany({
    where: {
      status: { in: ['pending_payment', 'confirmed', 'checked_in', 'completed'] },
      checkIn: { lt: end },
      checkOut: { gt: start },
    },
    select: { checkIn: true, checkOut: true, quantity: true, roomTypeId: true },
  });

  // Build per-day, per-roomType booked count
  const occupancy = new Map<string, Map<string, number>>();
  for (const b of bookings) {
    const bStart = new Date(Math.max(b.checkIn.getTime(), start.getTime()));
    const bEnd = new Date(Math.min(b.checkOut.getTime(), end.getTime()));
    const current = new Date(bStart);
    while (current < bEnd) {
      const day = current.toISOString().slice(0, 10);
      if (!occupancy.has(day)) occupancy.set(day, new Map());
      const dayMap = occupancy.get(day)!;
      dayMap.set(b.roomTypeId, (dayMap.get(b.roomTypeId) || 0) + b.quantity);
      current.setDate(current.getDate() + 1);
    }
  }

  const days: { date: string; roomType: string; total: number; booked: number; available: number }[] = [];
  const current = new Date(start);
  while (current < end) {
    const day = current.toISOString().slice(0, 10);
    const dayMap = occupancy.get(day) || new Map();
    for (const rt of roomTypes) {
      const total = rt._count.rooms;
      const booked = dayMap.get(rt.id) || 0;
      days.push({ date: day, roomType: rt.name, total, booked, available: Math.max(0, total - booked) });
    }
    current.setDate(current.getDate() + 1);
  }

  return days;
}

// ─── Boat reports ───

export async function getBoatDailyReport(dateFrom: string, dateTo: string) {
  const start = new Date(dateFrom);
  const end = new Date(dateTo);

  const bookings = await prisma.boatBooking.findMany({
    where: { createdAt: { gte: start, lte: end } },
    select: { createdAt: true, totalPrice: true, status: true },
    orderBy: { createdAt: 'asc' },
  });

  const dailyMap = new Map<string, { bookings: number; cancelled: number; revenue: number }>();
  for (const b of bookings) {
    const day = b.createdAt.toISOString().slice(0, 10);
    const entry = dailyMap.get(day) || { bookings: 0, cancelled: 0, revenue: 0 };
    entry.bookings += 1;
    entry.revenue += b.totalPrice;
    if (b.status === 'cancelled') entry.cancelled += 1;
    dailyMap.set(day, entry);
  }

  const days: { date: string; bookings: number; cancelled: number; revenue: number }[] = [];
  const current = new Date(start);
  while (current <= end) {
    const day = current.toISOString().slice(0, 10);
    days.push({ date: day, ...dailyMap.get(day) || { bookings: 0, cancelled: 0, revenue: 0 } });
    current.setDate(current.getDate() + 1);
  }
  return days;
}

export async function getBoatMonthlyReport(year: number) {
  const start = new Date(`${year}-01-01`);
  const end = new Date(`${year + 1}-01-01`);

  const bookings = await prisma.boatBooking.findMany({
    where: { createdAt: { gte: start, lt: end } },
    select: { createdAt: true, totalPrice: true, status: true },
    orderBy: { createdAt: 'asc' },
  });

  const monthlyMap = new Map<string, { bookings: number; cancelled: number; revenue: number }>();
  for (const b of bookings) {
    const month = `${b.createdAt.getFullYear()}-${String(b.createdAt.getMonth() + 1).padStart(2, '0')}`;
    const entry = monthlyMap.get(month) || { bookings: 0, cancelled: 0, revenue: 0 };
    entry.bookings += 1;
    entry.revenue += b.totalPrice;
    if (b.status === 'cancelled') entry.cancelled += 1;
    monthlyMap.set(month, entry);
  }

  const months: { month: string; bookings: number; cancelled: number; revenue: number }[] = [];
  for (let m = 0; m < 12; m++) {
    const month = `${year}-${String(m + 1).padStart(2, '0')}`;
    months.push({ month, ...monthlyMap.get(month) || { bookings: 0, cancelled: 0, revenue: 0 } });
  }
  return months;
}

export async function getBoatAvailabilityReport(dateFrom: string, dateTo: string) {
  const start = new Date(dateFrom);
  const end = new Date(dateTo);

  const timeSlots = await prisma.timeSlot.findMany({ include: { boatType: { select: { name: true } } } });
  const bookings = await prisma.boatBooking.findMany({
    where: {
      status: { in: ['pending_payment', 'confirmed', 'completed'] },
      date: { gte: start, lt: end },
    },
    select: { date: true, timeSlotId: true, boatCount: true },
  });

  const bookedMap = new Map<string, number>();
  for (const b of bookings) {
    const key = `${b.date.toISOString().slice(0, 10)}-${b.timeSlotId}`;
    bookedMap.set(key, (bookedMap.get(key) || 0) + b.boatCount);
  }

  const days: { date: string; timeSlotId: string; boatType: string; startTime: string; endTime: string; max: number; booked: number; available: number }[] = [];
  const current = new Date(start);
  while (current < end) {
    const day = current.toISOString().slice(0, 10);
    for (const ts of timeSlots) {
      const key = `${day}-${ts.id}`;
      const booked = bookedMap.get(key) || 0;
      days.push({
        date: day,
        timeSlotId: ts.id,
        boatType: ts.boatType.name,
        startTime: ts.startTime,
        endTime: ts.endTime,
        max: ts.maxBookings,
        booked,
        available: Math.max(0, ts.maxBookings - booked),
      });
    }
    current.setDate(current.getDate() + 1);
  }
  return days;
}

// ─── Package usage report ───

export async function getPackageUsageReport() {
  const packages = await prisma.package.findMany({
    include: {
      roomType: { select: { name: true } },
      _count: { select: { bookings: true } },
    },
  });

  const bookings = await prisma.roomBooking.findMany({
    where: { packageId: { not: null } },
    select: { packageId: true, totalPrice: true, createdAt: true },
  });

  return packages.map((pkg) => {
    const pkgBookings = bookings.filter((b) => b.packageId === pkg.id);
    const totalRevenue = pkgBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const peakMonth = findPeakMonth(pkgBookings.map((b) => b.createdAt));

    return {
      id: pkg.id,
      name: pkg.name,
      roomType: pkg.roomType.name,
      totalBookings: pkg._count.bookings,
      totalRevenue,
      peakMonth,
    };
  });
}

function findPeakMonth(dates: Date[]): string | null {
  if (dates.length === 0) return null;
  const counts = new Map<string, number>();
  for (const d of dates) {
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    counts.set(month, (counts.get(month) || 0) + 1);
  }
  let peak: string | null = null;
  let max = 0;
  for (const [month, count] of counts) {
    if (count > max) { max = count; peak = month; }
  }
  return peak;
}
