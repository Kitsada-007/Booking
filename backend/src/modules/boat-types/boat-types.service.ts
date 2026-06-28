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

export async function listBoatTypes(params: PaginationParams): Promise<PaginatedResult<unknown>> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));

  const [data, totalItems] = await Promise.all([
    prisma.boatType.findMany({
      include: boatTypeInclude,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.boatType.count(),
  ]);

  return {
    data: data.map((bt) => ({
      ...bt,
      boatCount: bt._count.boats,
    })),
    pagination: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) },
  };
}

export async function getBoatType(id: string) {
  const boatType = await prisma.boatType.findUnique({
    where: { id },
    include: {
      _count: { select: { boats: true } },
      boats: { select: { id: true, boatNumber: true } },
    },
  });

  if (!boatType) throw new Error('Boat type not found');

  return { ...boatType, boatCount: boatType._count.boats };
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
