import { describe, it, expect } from 'bun:test';
import { app } from './index';

describe('Elysia App', () => {
  it('returns welcome message on GET /', async () => {
    const res = await app.handle(new Request('http://localhost/'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe('Welcome to Usul Data API');
  });

  it('returns ok on GET /health', async () => {
    const res = await app.handle(new Request('http://localhost/health'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('api');
  });
});
