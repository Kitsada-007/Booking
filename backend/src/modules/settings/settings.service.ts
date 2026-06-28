import { prisma } from '../../common/prisma';

// ─── Bank Accounts ───

export async function listBankAccounts() {
  return prisma.bankAccount.findMany({ orderBy: { bankName: 'asc' } });
}

export async function createBankAccount(input: { bankName: string; accountName: string; accountNumber: string }) {
  return prisma.bankAccount.create({ data: input });
}

export async function deleteBankAccount(id: string) {
  const existing = await prisma.bankAccount.findUnique({ where: { id } });
  if (!existing) throw new Error('Bank account not found');

  await prisma.bankAccount.delete({ where: { id } });
}

// ─── Settings ───

export async function getSettings() {
  const settings = await prisma.setting.findUnique({ where: { id: 'default' } });
  if (settings) return settings;
  return prisma.setting.create({ data: { id: 'default' } });
}

export async function updateSettings(input: {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  facebook?: string;
  line?: string;
  businessHours?: string;
  terms?: string;
  boatOpenTime?: string;
  boatCloseTime?: string;
}) {
  const existing = await prisma.setting.findUnique({ where: { id: 'default' } });
  if (!existing) {
    return prisma.setting.create({ data: { id: 'default', ...input } });
  }
  return prisma.setting.update({ where: { id: 'default' }, data: input });
}
