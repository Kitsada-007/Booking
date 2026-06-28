import bcrypt from 'bcrypt';
import { prisma } from '../../common/prisma';

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  address: true,
  profileImage: true,
  role: true,
  status: true,
  lineId: true,
  facebook: true,
  createdAt: true,
  updatedAt: true,
} as const;

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

export async function listUsers(params: {
  page?: number;
  pageSize?: number;
  role?: string;
  status?: string;
}): Promise<PaginatedResult<unknown>> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));

  const where: Record<string, unknown> = {
    role: { not: 'member' },
  };
  if (params.role) where.role = params.role;
  if (params.status) where.status = params.status;

  const [data, totalItems] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userSelect,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
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

export async function createStaff(input: {
  email: string;
  password: string;
  role: 'room_staff' | 'boat_staff';
  status: 'active' | 'inactive';
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new Error('Email already in use');
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: '',
      lastName: '',
      role: input.role,
      status: input.status,
    },
    select: userSelect,
  });

  return user;
}

export async function updateStaff(
  id: string,
  input: {
    status?: 'active' | 'inactive';
    role?: 'room_staff' | 'boat_staff';
  }
) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role === 'member') {
    throw new Error('User not found');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: input,
    select: userSelect,
  });

  return updated;
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

export async function updateProfile(
  userId: string,
  input: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    lineId?: string;
    facebook?: string;
    profileImage?: string;
  }
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: input,
    select: userSelect,
  });

  return user;
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.passwordHash) {
    throw new Error('Cannot change password for this account');
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw new Error('Current password is incorrect');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return 'Password updated';
}
