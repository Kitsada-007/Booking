import { prisma } from '../../common/prisma';

export async function listTimeSlots(boatTypeId?: string) {
  const where = boatTypeId ? { boatTypeId } : {};
  return prisma.timeSlot.findMany({
    where,
    include: { boatType: { select: { id: true, name: true } } },
    orderBy: [{ boatTypeId: 'asc' }, { startTime: 'asc' }],
  });
}

export async function getTimeSlot(id: string) {
  const slot = await prisma.timeSlot.findUnique({
    where: { id },
    include: { boatType: { select: { id: true, name: true } } },
  });
  if (!slot) throw new Error('Time slot not found');
  return slot;
}

export async function createTimeSlot(input: {
  startTime: string;
  endTime: string;
  maxBookings: number;
  boatTypeId: string;
}) {
  const boatType = await prisma.boatType.findUnique({ where: { id: input.boatTypeId } });
  if (!boatType) throw new Error('Boat type not found');

  return prisma.timeSlot.create({
    data: input,
    include: { boatType: { select: { id: true, name: true } } },
  });
}

export async function updateTimeSlot(id: string, input: {
  startTime?: string;
  endTime?: string;
  maxBookings?: number;
  boatTypeId?: string;
}) {
  const existing = await prisma.timeSlot.findUnique({ where: { id } });
  if (!existing) throw new Error('Time slot not found');

  if (input.boatTypeId) {
    const boatType = await prisma.boatType.findUnique({ where: { id: input.boatTypeId } });
    if (!boatType) throw new Error('Boat type not found');
  }

  return prisma.timeSlot.update({
    where: { id },
    data: input,
    include: { boatType: { select: { id: true, name: true } } },
  });
}

export async function deleteTimeSlot(id: string) {
  const existing = await prisma.timeSlot.findUnique({ where: { id } });
  if (!existing) throw new Error('Time slot not found');

  await prisma.timeSlot.delete({ where: { id } });
}
