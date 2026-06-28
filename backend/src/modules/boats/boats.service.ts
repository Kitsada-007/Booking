import { prisma } from '../../common/prisma';

export async function listBoats(params: { boatTypeId?: string }) {
  const where: Record<string, unknown> = {};
  if (params.boatTypeId) where.boatTypeId = params.boatTypeId;

  return prisma.boat.findMany({
    where,
    include: { boatType: { select: { id: true, name: true } } },
    orderBy: { boatNumber: 'asc' },
  });
}

export async function createBoat(input: { boatNumber: string; boatTypeId: string }) {
  const boatType = await prisma.boatType.findUnique({ where: { id: input.boatTypeId } });
  if (!boatType) throw new Error('Boat type not found');

  const existing = await prisma.boat.findUnique({
    where: { boatNumber_boatTypeId: { boatNumber: input.boatNumber, boatTypeId: input.boatTypeId } },
  });
  if (existing) throw new Error('Boat number already exists for this boat type');

  return prisma.boat.create({
    data: input,
    include: { boatType: { select: { id: true, name: true } } },
  });
}

export async function updateBoat(id: string, input: { boatNumber?: string; boatTypeId?: string }) {
  const existing = await prisma.boat.findUnique({ where: { id } });
  if (!existing) throw new Error('Boat not found');

  return prisma.boat.update({
    where: { id },
    data: input,
    include: { boatType: { select: { id: true, name: true } } },
  });
}

export async function deleteBoat(id: string) {
  const existing = await prisma.boat.findUnique({ where: { id } });
  if (!existing) throw new Error('Boat not found');

  await prisma.boat.delete({ where: { id } });
}
