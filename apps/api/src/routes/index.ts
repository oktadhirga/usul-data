import { Elysia } from 'elysia';
import { healthRoute } from './health.route';
import { userRoute } from './user.route';

export const appRoutes = new Elysia({ prefix: '/api' })
  .use(healthRoute)
  .use(userRoute);
