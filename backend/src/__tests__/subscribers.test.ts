import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';

vi.mock('@prisma/client', () => {
  const subscriber = { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn() };
  const user = { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() };
  const post = { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() };
  const newsletter = { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() };
  const newsletterSection = { findFirst: vi.fn() };
  const newsletterSectionPost = { upsert: vi.fn(), findUnique: vi.fn(), delete: vi.fn() };
  const category = { findUnique: vi.fn() };
  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      subscriber, user, post, newsletter, newsletterSection, newsletterSectionPost, category,
    })),
  };
});

vi.mock('bcryptjs', () => ({ default: { hash: vi.fn(), compare: vi.fn() } }));

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient() as any;

const token = `Bearer ${jwt.sign(
  { userId: 1, email: 'admin@crm.com', role: 'ADMIN' },
  'change_me_in_production',
  { expiresIn: '1h' }
)}`;

beforeEach(() => vi.clearAllMocks());

describe('POST /api/subscribers', () => {
  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/api/subscribers').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/api/subscribers')
      .send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid email/i);
  });

  it('returns 409 when email already subscribed', async () => {
    db.subscriber.findUnique.mockResolvedValue({ id: 1, email: 'existing@test.com' });

    const res = await request(app)
      .post('/api/subscribers')
      .send({ email: 'existing@test.com' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Email already subscribed');
  });

  it('subscribes a new email without requiring auth', async () => {
    db.subscriber.findUnique.mockResolvedValue(null);
    db.subscriber.create.mockResolvedValue({
      id: 1,
      email: 'new@test.com',
      createdAt: new Date(),
    });

    const res = await request(app)
      .post('/api/subscribers')
      .send({ email: 'new@test.com' });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe('new@test.com');
  });
});

describe('GET /api/subscribers', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/subscribers');
    expect(res.status).toBe(401);
  });

  it('returns subscriber list for authenticated user', async () => {
    db.subscriber.findMany.mockResolvedValue([
      { id: 1, email: 'user@test.com', createdAt: new Date() },
    ]);

    const res = await request(app)
      .get('/api/subscribers')
      .set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].email).toBe('user@test.com');
  });
});
