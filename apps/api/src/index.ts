import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { loggerMiddleware } from './middleware/logger';
import { healthRoute } from './routes/health.route';
import { appRoutes } from './routes';

const port = Number(process.env.PORT) || 3000;

export const app = new Elysia()
  .use(cors())
  .use(loggerMiddleware)
  .use(healthRoute)
  .use(appRoutes)
  .get('/', () => ({
    message: 'Welcome to Usul Data API',
    docs: '/health'
  }))
  .listen(port);

console.log(`🦊 Elysia API is running at ${app.server?.hostname}:${app.server?.port}`);
