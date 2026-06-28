import { prisma } from '../../common/prisma';

interface PaginationParams {
  page?: number;
  pageSize?: number;
}

interface PaginatedResult<T> {
  data: T[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
}

const boatTypeInclude = {
  _count: { select: { boats: true } },
};

async function getTimeSlotAvailability(boatTypeId: string, date?: string) {
  const slots = await prisma.timeSlot.findMany({ where: { boatTypeId } });
  if (!date || slots.length === 0) return [];

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return [];

  const bookedCounts = await prisma.boatBooking.groupBy({
    by: ['timeSlotId'],
    where: {
      timeSlotId: { in: slots.map((s) => s.id) },
      date: dateObj,
      status: { in: ['pending_payment', 'confirmed'] },
    },
    _sum: { boatCount: true },
  });

  const bookedMap = new Map(bookedCounts.map((b) => [b.timeSlotId, b._sum.boatCount ?? 0]));

  return slots.map((s) => ({
    id: s.id,
    startTime: s.startTime,
    endTime: s.endTime,
    maxBookings: s.maxBookings,
    booked: bookedMap.get(s.id) ?? 0,
    available: s.maxBookings - (bookedMap.get(s.id) ?? 0),
  }));
}

export async function listBoatTypes(params: PaginationParams & { date?: string }): Promise<PaginatedResult<unknown>> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));

  const [data, totalItems] = await Promise.all([
    prisma.boatType.findMany({
      include: { _count: { select: { boats: true } }, timeSlots: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.boatType.count(),
  ]);

  let result = await Promise.all(data.map(async (bt) => ({
    ...bt,
    boatCount: bt._count.boats,
    timeSlots: params.date ? await getTimeSlotAvailability(bt.id, params.date) : bt.timeSlots,
  })));

  return {
    data: result,
    pagination: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) },
  };
}

export async function getBoatType(id: string, date?: string) {
  const boatType = await prisma.boatType.findUnique({
    where: { id },
    include: {
      _count: { select: { boats: true } },
      boats: { select: { id: true, boatNumber: true } },
      timeSlots: true,
    },
  });

  if (!boatType) throw new Error('Boat type not found');

  return {
    ...boatType,
    boatCount: boatType._count.boats,
    timeSlots: date ? await getTimeSlotAvailability(boatType.id, date) : boatType.timeSlots,
  };
}

export async function createBoatType(input: {
  name: string;
  capacity: number;
  seats: number;
  price: number;
  durationMinutes: number;
  images?: string[];
}) {
  const boatType = await prisma.boatType.create({
    data: { ...input, images: input.images ?? [] },
    include: boatTypeInclude,
  });

  return { ...boatType, boatCount: boatType._count.boats };
}

export async function updateBoatType(
  id: string,
  input: {
    name?: string;
    capacity?: number;
    seats?: number;
    price?: number;
    durationMinutes?: number;
    images?: string[];
  }
) {
  const existing = await prisma.boatType.findUnique({ where: { id } });
  if (!existing) throw new Error('Boat type not found');

  const boatType = await prisma.boatType.update({
    where: { id },
    data: input,
    include: boatTypeInclude,
  });

  return { ...boatType, boatCount: boatType._count.boats };
}

export async function deleteBoatType(id: string) {
  const existing = await prisma.boatType.findUnique({
    where: { id },
    include: { _count: { select: { boats: true } } },
  });

  if (!existing) throw new Error('Boat type not found');
  if (existing._count.boats > 0) throw new Error('Cannot delete boat type with existing boats');

  await prisma.boatType.delete({ where: { id } });
}
