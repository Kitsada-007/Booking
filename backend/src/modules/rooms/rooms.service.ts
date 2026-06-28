import { prisma } from '../../common/prisma';

export async function listRooms(params: { roomTypeId?: string; status?: string }) {
  const where: Record<string, unknown> = {};
  if (params.roomTypeId) where.roomTypeId = params.roomTypeId;
  if (params.status) where.status = params.status;

  return prisma.room.findMany({
    where,
    include: { roomType: { select: { id: true, name: true } } },
    orderBy: { roomNumber: 'asc' },
  });
}

export async function createRoom(input: { roomNumber: string; roomTypeId: string; description?: string }) {
  const roomType = await prisma.roomType.findUnique({ where: { id: input.roomTypeId } });
  if (!roomType) {
    throw new Error('Room type not found');
  }

  const existing = await prisma.room.findUnique({
    where: { roomNumber_roomTypeId: { roomNumber: input.roomNumber, roomTypeId: input.roomTypeId } },
  });
  if (existing) {
    throw new Error('Room number already exists for this room type');
  }

  return prisma.room.create({
    data: input,
    include: { roomType: { select: { id: true, name: true } } },
  });
}

export async function updateRoom(
  id: string,
  input: { roomNumber?: string; roomTypeId?: string; status?: string; description?: string }
) {
  const existing = await prisma.room.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Room not found');
  }

  return prisma.room.update({
    where: { id },
    data: input,
    include: { roomType: { select: { id: true, name: true } } },
  });
}

export async function deleteRoom(id: string) {
  const existing = await prisma.room.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Room not found');
  }

  await prisma.room.delete({ where: { id } });
}
