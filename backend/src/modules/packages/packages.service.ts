import { prisma } from "../../common/prisma";

interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export async function listPackages(
  params: PaginationParams & { activeOnly?: boolean },
) {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const where: Record<string, unknown> = {};

  if (params.activeOnly) where.isActive = true;

  const [data, totalItems] = await Promise.all([
    prisma.package.findMany({
      where,
      include: {
        roomType: {
          select: { id: true, name: true, price: true, images: true },
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { startDate: "asc" },
    }),
    prisma.package.count({ where }),
  ]);

  return {
    data,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    },
  };
}

export async function getPackage(id: string) {
  const pkg = await prisma.package.findUnique({
    where: { id },
    include: {
      roomType: {
        select: {
          id: true,
          name: true,
          price: true,
          capacity: true,
          images: true,
        },
      },
      _count: { select: { bookings: true } },
    },
  });

  if (!pkg) throw new Error("Package not found");
  return { ...pkg, bookingCount: pkg._count.bookings };
}

export async function createPackage(input: {
  name: string;
  roomTypeId: string;
  roomQuantity: number;
  price: number;
  startDate: string;
  endDate: string;
  details?: string;
  isActive?: boolean;
}) {
  const roomType = await prisma.roomType.findUnique({
    where: { id: input.roomTypeId },
  });
  if (!roomType) throw new Error("Room type not found");

  const pkg = await prisma.package.create({
    data: {
      name: input.name,
      roomTypeId: input.roomTypeId,
      roomQuantity: input.roomQuantity,
      price: input.price,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      details: input.details,
      isActive: input.isActive ?? true,
    },
    include: { roomType: { select: { id: true, name: true } } },
  });

  return pkg;
}

export async function updatePackage(
  id: string,
  input: {
    name?: string;
    roomTypeId?: string;
    roomQuantity?: number;
    price?: number;
    startDate?: string;
    endDate?: string;
    details?: string;
    isActive?: boolean;
  },
) {
  const existing = await prisma.package.findUnique({ where: { id } });
  if (!existing) throw new Error("Package not found");

  if (input.roomTypeId) {
    const roomType = await prisma.roomType.findUnique({
      where: { id: input.roomTypeId },
    });
    if (!roomType) throw new Error("Room type not found");
  }

  const data: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(input)) {
    if (val !== undefined) data[key] = val;
  }
  if (input.startDate) data.startDate = new Date(input.startDate);
  if (input.endDate) data.endDate = new Date(input.endDate);

  const pkg = await prisma.package.update({
    where: { id },
    data,
    include: { roomType: { select: { id: true, name: true } } },
  });

  return pkg;
}

export async function deletePackage(id: string) {
  const existing = await prisma.package.findUnique({
    where: { id },
    include: { _count: { select: { bookings: true } } },
  });

  if (!existing) throw new Error("Package not found");
  if (existing._count.bookings > 0)
    throw new Error("Cannot delete package with existing bookings");

  await prisma.package.delete({ where: { id } });
}
