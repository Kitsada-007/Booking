import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AuthResult } from './auth.service';

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  otp: {
    create: vi.fn(),
    findFirst: vi.fn(),
    updateMany: vi.fn(),
  },
}));

vi.mock('../../common/prisma', () => ({
  prisma: mockPrisma,
}));

const mockBcrypt = vi.hoisted(() => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

vi.mock('bcrypt', () => ({
  default: {
    hash: mockBcrypt.hash,
    compare: mockBcrypt.compare,
  },
  hash: mockBcrypt.hash,
  compare: mockBcrypt.compare,
}));

const mockJwt = vi.hoisted(() => ({
  sign: vi.fn(() => 'mock-token'),
  verify: vi.fn(),
}));

vi.mock('jsonwebtoken', () => ({
  default: mockJwt,
  sign: mockJwt.sign,
  verify: mockJwt.verify,
}));

const { register, login, refreshTokens, forgotPassword, resetPassword } = await import('./auth.service');

describe('AuthService.register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a user with hashed password and returns user + tokens', async () => {
    const input = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      phone: '0812345678',
    };

    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockBcrypt.hash.mockResolvedValue('hashed_password_123');
    mockPrisma.user.create.mockResolvedValue({
      id: 'user_1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      phone: '0812345678',
      passwordHash: 'hashed_password_123',
      role: 'member',
      status: 'active',
      lineId: null,
      facebook: null,
      address: null,
      profileImage: null,
      googleId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result: AuthResult = await register(input);

    expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 12);
    expect(mockPrisma.user.create).toHaveBeenCalled();
    expect(result.user.email).toBe('test@example.com');
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('throws when email already exists', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' } as any);

    await expect(
      register({
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        phone: '0812345678',
      })
    ).rejects.toThrow('Email already in use');
  });
});

describe('AuthService.login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns tokens when credentials are valid', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user_1',
      email: 'test@example.com',
      passwordHash: '$2b$10$hashedpassword',
      firstName: 'Test',
      lastName: 'User',
      role: 'member',
      status: 'active',
    } as any);
    mockBcrypt.compare.mockResolvedValue(true as never);

    const result = await login({ email: 'test@example.com', password: 'password123' });

    expect(result.user.email).toBe('test@example.com');
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('throws when user not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(
      login({ email: 'notfound@example.com', password: 'password123' })
    ).rejects.toThrow('Invalid email or password');
  });

  it('throws when password is wrong', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user_1',
      email: 'test@example.com',
      passwordHash: '$2b$10$differenthash',
      status: 'active',
    } as any);
    mockBcrypt.compare.mockResolvedValue(false as never);

    await expect(
      login({ email: 'test@example.com', password: 'wrongpassword' })
    ).rejects.toThrow('Invalid email or password');
  });

  it('throws when account is inactive', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user_1',
      email: 'inactive@example.com',
      passwordHash: '$2b$10$hashedpassword',
      status: 'inactive',
    } as any);
    mockBcrypt.compare.mockResolvedValue(true as never);

    await expect(
      login({ email: 'inactive@example.com', password: 'password123' })
    ).rejects.toThrow('Account is inactive');
  });
});

describe('AuthService.refreshTokens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns new tokens when refresh token is valid', async () => {
    mockJwt.verify.mockReturnValue({ userId: 'user_1', role: 'member' });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user_1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'member',
      status: 'active',
    } as any);

    const result = await refreshTokens('valid-refresh-token');

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.user.id).toBe('user_1');
  });

  it('throws when refresh token is invalid', async () => {
    mockJwt.verify.mockImplementation(() => { throw new Error('jwt malformed'); });

    await expect(refreshTokens('bad-token')).rejects.toThrow('Invalid refresh token');
  });

  it('throws when user not found', async () => {
    mockJwt.verify.mockReturnValue({ userId: 'nonexistent', role: 'member' });
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(refreshTokens('valid-token-no-user')).rejects.toThrow('User not found');
  });
});

describe('AuthService.forgotPassword', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('creates OTP and returns success for existing email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user_1', email: 'test@example.com' } as any);
    mockPrisma.otp.create.mockResolvedValue({ id: 'otp_1' });

    const result = await forgotPassword('test@example.com');

    expect(mockPrisma.otp.create).toHaveBeenCalled();
    expect(result).toBe('OTP sent to email');
  });

  it('returns success even for non-existent email (security)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const result = await forgotPassword('unknown@example.com');

    expect(result).toBe('OTP sent to email');
    expect(mockPrisma.otp.create).not.toHaveBeenCalled();
  });
});

describe('AuthService.resetPassword', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('resets password when OTP is valid', async () => {
    mockPrisma.otp.findFirst.mockResolvedValue({ id: 'otp_1', email: 'test@example.com', used: false, expiresAt: new Date(Date.now() + 600000) } as any);
    mockBcrypt.hash.mockResolvedValue('new_hashed_password');
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user_1' } as any);

    const result = await resetPassword({ email: 'test@example.com', otp: '123456', newPassword: 'newpass123' });

    expect(mockBcrypt.hash).toHaveBeenCalledWith('newpass123', 12);
    expect(result).toBe('Password updated');
  });

  it('throws when OTP is invalid', async () => {
    mockPrisma.otp.findFirst.mockResolvedValue(null);

    await expect(
      resetPassword({ email: 'test@example.com', otp: 'wrong', newPassword: 'newpass123' })
    ).rejects.toThrow('Invalid or expired OTP');
  });

  it('throws when OTP is expired', async () => {
    mockPrisma.otp.findFirst.mockResolvedValue({ id: 'otp_1', used: false, expiresAt: new Date(Date.now() - 600000) } as any);

    await expect(
      resetPassword({ email: 'test@example.com', otp: '123456', newPassword: 'newpass123' })
    ).rejects.toThrow('Invalid or expired OTP');
  });

  it('throws when OTP is already used', async () => {
    mockPrisma.otp.findFirst.mockResolvedValue({ id: 'otp_1', used: true, expiresAt: new Date(Date.now() + 600000) } as any);

    await expect(
      resetPassword({ email: 'test@example.com', otp: '123456', newPassword: 'newpass123' })
    ).rejects.toThrow('Invalid or expired OTP');
  });
});
