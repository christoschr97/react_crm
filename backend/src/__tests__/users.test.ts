import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';

process.env.JWT_SECRET = 'test-secret';

// Mock PrismaClient
vi.mock('@prisma/client', () => {
  const findMany = vi.fn();
  const findUnique = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const deleteUser = vi.fn();
  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      user: { findMany, findUnique, create, update, delete: deleteUser },
    })),
  };
});

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn(),
  },
}));

import { PrismaClient } from '@prisma/client';

const prismaMock = new PrismaClient() as any;

// Generate a valid token for tests
const validToken = jwt.sign(
  { userId: 1, email: 'admin@crm.com', role: 'ADMIN' },
  'test-secret',
  { expiresIn: '1h' }
);
const authHeader = `Bearer ${validToken}`;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/users', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('returns list of users', async () => {
    prismaMock.user.findMany.mockResolvedValue([
      { id: 1, email: 'admin@crm.com', name: 'Admin', role: 'ADMIN', isActive: true, createdAt: new Date() },
    ]);

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].email).toBe('admin@crm.com');
  });
});

describe('POST /api/users', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', authHeader)
      .send({ email: 'new@crm.com' });

    expect(res.status).toBe(400);
  });

  it('returns 409 when email already exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 2, email: 'existing@crm.com' });

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', authHeader)
      .send({ email: 'existing@crm.com', password: 'pass', name: 'Dupe' });

    expect(res.status).toBe(409);
  });

  it('creates user and returns 201', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: 2, email: 'new@crm.com', name: 'New User', role: 'EDITOR', isActive: true, createdAt: new Date(),
    });

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', authHeader)
      .send({ email: 'new@crm.com', password: 'pass123', name: 'New User' });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe('new@crm.com');
    expect(res.body.passwordHash).toBeUndefined();
  });
});

describe('PATCH /api/users/:id', () => {
  it('returns 404 when user not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/users/999')
      .set('Authorization', authHeader)
      .send({ isActive: false });

    expect(res.status).toBe(404);
  });

  it('deactivates a user', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 2 });
    prismaMock.user.update.mockResolvedValue({
      id: 2, email: 'editor@crm.com', name: 'Editor', role: 'EDITOR', isActive: false, updatedAt: new Date(),
    });

    const res = await request(app)
      .patch('/api/users/2')
      .set('Authorization', authHeader)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.isActive).toBe(false);
  });
});

describe('DELETE /api/users/:id', () => {
  it('returns 404 when user not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/users/999')
      .set('Authorization', authHeader);

    expect(res.status).toBe(404);
  });

  it('deletes user and returns 204', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 2 });
    prismaMock.user.delete.mockResolvedValue({});

    const res = await request(app)
      .delete('/api/users/2')
      .set('Authorization', authHeader);

    expect(res.status).toBe(204);
  });
});
