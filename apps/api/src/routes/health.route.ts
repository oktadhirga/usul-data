import { Elysia } from 'elysia';

export const healthRoute = new Elysia({ prefix: '/health' })
  .get('/', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'api'
  }));
