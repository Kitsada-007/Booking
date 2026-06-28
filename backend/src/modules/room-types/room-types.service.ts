import { prisma } from '../../common/prisma';

interface PaginationParams {
  page?: number;
  pageSize?: number;
}

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

const roomTypeInclude = {
  _count: { select: { rooms: true, reviews: true } },
};

export async function listRoomTypes(params: PaginationParams & { checkIn?: string }): Promise<PaginatedResult<unknown>> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));

  const [data, totalItems] = await Promise.all([
    prisma.roomType.findMany({
      include: roomTypeInclude,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.roomType.count(),
  ]);

  let result = data.map((rt) => ({
    ...rt,
    roomCount: rt._count.rooms,
    reviewCount: rt._count.reviews,
  }));

  if (params.checkIn) {
    const date = new Date(params.checkIn);
    if (!isNaN(date.getTime())) {
      const bookedCounts = await prisma.roomBooking.groupBy({
        by: ['roomTypeId'],
        where: {
          roomTypeId: { in: data.map((rt) => rt.id) },
          checkIn: { lte: date },
          checkOut: { gt: date },
          status: { in: ['confirmed', 'pending_payment'] },
        },
        _sum: { quantity: true },
      });

      const bookedMap = new Map(bookedCounts.map((b) => [b.roomTypeId, b._sum.quantity ?? 0]));

      result = result.map((rt) => ({
        ...rt,
        availableRooms: Math.max(0, rt.roomCount - (bookedMap.get(rt.id) ?? 0)),
      }));
    }
  }

  return {
    data: result,
    pagination: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) },
  };
}

export async function getRoomType(id: string) {
  const roomType = await prisma.roomType.findUnique({
    where: { id },
    include: {
      _count: { select: { rooms: true, reviews: true } },
      rooms: { select: { id: true, roomNumber: true, status: true } },
    },
  });

  if (!roomType) {
    throw new Error('Room type not found');
  }

  return {
    ...roomType,
    roomCount: roomType._count.rooms,
    reviewCount: roomType._count.reviews,
  };
}

export async function createRoomType(input: {
  name: string;
  price: number;
  capacity: number;
  bedSize?: string;
  bedCount?: number;
  hasAircon?: boolean;
  hasTv?: boolean;
  description?: string;
  images?: string[];
}) {
  const roomType = await prisma.roomType.create({
    data: {
      name: input.name,
      price: input.price,
      capacity: input.capacity,
      bedSize: input.bedSize,
      bedCount: input.bedCount ?? 1,
      hasAircon: input.hasAircon ?? true,
      hasTv: input.hasTv ?? true,
      description: input.description,
      images: input.images ?? [],
    },
    include: roomTypeInclude,
  });

  return { ...roomType, roomCount: roomType._count.rooms, reviewCount: roomType._count.reviews };
}

export async function updateRoomType(
  id: string,
  input: {
    name?: string;
    price?: number;
    capacity?: number;
    bedSize?: string;
    bedCount?: number;
    hasAircon?: boolean;
    hasTv?: boolean;
    description?: string;
    images?: string[];
  }
) {
  const existing = await prisma.roomType.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Room type not found');
  }

  const roomType = await prisma.roomType.update({
    where: { id },
    data: input,
    include: roomTypeInclude,
  });

  return { ...roomType, roomCount: roomType._count.rooms, reviewCount: roomType._count.reviews };
}

export async function deleteRoomType(id: string) {
  const existing = await prisma.roomType.findUnique({
    where: { id },
    include: { _count: { select: { rooms: true } } },
  });

  if (!existing) {
    throw new Error('Room type not found');
  }

  if (existing._count.rooms > 0) {
    throw new Error('Cannot delete room type with existing rooms');
  }

  await prisma.roomType.delete({ where: { id } });
}
