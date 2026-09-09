import { Elysia } from 'elysia';

export const loggerMiddleware = new Elysia({ name: 'middleware:logger' })
  .onRequest(({ request }) => {
    console.log(`[REQUEST] ${request.method} ${new URL(request.url).pathname}`);
  })
  .onAfterResponse(({ request, set }) => {
    console.log(`[RESPONSE] ${request.method} ${new URL(request.url).pathname} - status: ${set.status ?? 200}`);
  });
