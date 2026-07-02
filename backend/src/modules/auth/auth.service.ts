import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../../common/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';

export interface AuthResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

function generateTokens(userId: string, role: string) {
  const accessToken = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId, role }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

export async function refreshTokens(refreshToken: string): Promise<AuthResult> {
  let payload: { userId: string; role: string };
  try {
    payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string; role: string };
  } catch {
    throw new Error('Invalid refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.status === 'inactive') {
    throw new Error('User not found');
  }

  const tokens = generateTokens(user.id, user.role);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    ...tokens,
  };
}

export async function login(input: { email: string; password: string }): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !user.passwordHash) {
    throw new Error('Invalid email or password');
  }

  if (user.status === 'inactive') {
    throw new Error('Account is inactive');
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid email or password');
  }

  const tokens = generateTokens(user.id, user.role);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    ...tokens,
  };
}

export async function forgotPassword(email: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return 'OTP sent to email';
  }

  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.otp.create({
    data: { email, code, expiresAt },
  });

  console.log(`[EMAIL] OTP for ${email}: ${code}`);
  return 'OTP sent to email';
}

export async function resetPassword(input: { email: string; otp: string; newPassword: string }): Promise<string> {
  const otp = await prisma.otp.findFirst({
    where: { email: input.email, code: input.otp, used: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp || otp.used || otp.expiresAt < new Date()) {
    throw new Error('Invalid or expired OTP');
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 12);

  await prisma.user.update({
    where: { email: input.email },
    data: { passwordHash },
  });

  await prisma.otp.updateMany({
    where: { email: input.email },
    data: { used: true },
  });

  return 'Password updated';
}

export async function googleLogin(googleToken: string): Promise<AuthResult> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('Google OAuth not configured');
  }

  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({ idToken: googleToken, audience: clientId });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error('Invalid Google token');
  }

  let user = await prisma.user.findUnique({ where: { email: payload.email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: payload.email,
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
        googleId: payload.sub,
        profileImage: payload.picture,
        role: 'member',
        status: 'active',
      },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId: payload.sub },
    });
  }

  const tokens = generateTokens(user.id, user.role);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    ...tokens,
  };
}

export async function register(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new Error('Email already in use');
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      role: 'member',
      status: 'active',
    },
  });

  const tokens = generateTokens(user.id, user.role);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    ...tokens,
  };
}
