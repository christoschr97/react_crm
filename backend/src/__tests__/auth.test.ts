import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';

// Mock PrismaClient
vi.mock('@prisma/client', () => {
  const findUnique = vi.fn();
  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      user: { findUnique },
    })),
  };
});

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn(),
  },
}));

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prismaMock = new PrismaClient() as any;
const bcryptMock = bcrypt as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/auth/login', () => {
  it('returns 400 when email or password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@crm.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it('returns 401 when user does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@crm.com', password: 'pass' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('returns 403 when user is inactive', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'admin@crm.com',
      passwordHash: 'hash',
      isActive: false,
      role: 'ADMIN',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@crm.com', password: 'admin123' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Account is deactivated');
  });

  it('returns 401 when password is wrong', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'admin@crm.com',
      passwordHash: 'hash',
      isActive: true,
      role: 'ADMIN',
    });
    bcryptMock.compare.mockResolvedValue(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@crm.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('returns token and user on valid credentials', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'admin@crm.com',
      name: 'Admin',
      passwordHash: 'hash',
      isActive: true,
      role: 'ADMIN',
    });
    bcryptMock.compare.mockResolvedValue(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@crm.com', password: 'admin123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('admin@crm.com');
    expect(res.body.user.passwordHash).toBeUndefined();
  });
});
