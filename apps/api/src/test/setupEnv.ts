/**
 * Loaded by Jest (via jest.config.js `setupFiles`) BEFORE any test
 * file or the modules it imports run. Provides fake-but-valid values
 * for every required env var so `src/config/env.ts`'s Zod parse
 * succeeds during unit tests, which never touch a real database or
 * real secrets — only integration tests (Step 7.2) load `.env.test`
 * for a real DATABASE_URL.
 */
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test_db';
process.env.DIRECT_URL ??= 'postgresql://test:test@localhost:5432/test_db';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-at-least-32-characters-long';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-at-least-32-characters-long';
process.env.CORS_ORIGIN ??= 'http://localhost:3000';
