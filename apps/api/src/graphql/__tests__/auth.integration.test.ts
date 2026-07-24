import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '@/app';
import { prisma } from '@/lib/prisma';

/**
 * Boots the real Express+Apollo app (no mocking) and exercises it via HTTP through supertest, against a
 * REAL test database. Proves the whole pipeline — validation, service, Prisma, GraphQL
 * schema — is wired correctly end-to-end, not just each piece in isolation.
 */
describe('Auth GraphQL integration', () => {
  let app: Express;
  const testEmail = `integration-test-${Date.now()}@example.com`;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  it('registers a new user, sets cookies, and rejects a duplicate registration', async () => {
    const registerResponse = await request(app)
      .post('/graphql')
      .send({
        query: `mutation Register($input: RegisterInput!) {
          register(input: $input) { user { id email } }
        }`,
        variables: {
          input: { email: testEmail, password: 'Password1', firstName: 'Test', lastName: 'User' },
        },
      });

    expect(registerResponse.body.data.register.user.email).toBe(testEmail);
    expect(registerResponse.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('access_token=')]),
    );

    const duplicateResponse = await request(app)
      .post('/graphql')
      .send({
        query: `mutation Register($input: RegisterInput!) {
          register(input: $input) { user { id } }
        }`,
        variables: {
          input: { email: testEmail, password: 'Password1', firstName: 'Test', lastName: 'User' },
        },
      });

    expect(duplicateResponse.body.errors[0].message).toContain('already exists');
  });

  it('rejects `me` query when no auth cookie is present', async () => {
    const response = await request(app).post('/graphql').send({ query: '{ me { id } }' });

    // `me` returns null for unauthenticated requests rather than erroring 
    expect(response.body.data.me).toBeNull();
  });

  it('rejects a protected mutation (createCategory) with no auth cookie', async () => {
    const response = await request(app).post('/graphql').send({
      query: `mutation { createCategory(input: { name: "Test" }) { id } }`,
    });

    expect(response.body.errors[0].message).toBe('You must be logged in to perform this action.');
    expect(response.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
  });
});
