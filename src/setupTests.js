import '@testing-library/jest-dom/vitest';
import { beforeEach, vi } from 'vitest';

beforeEach(() => {
  global.fetch = vi.fn(async () => ({
    ok: false,
    status: 401,
    json: async () => ({}),
  }));
});
