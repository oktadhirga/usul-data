import { Elysia, t } from 'elysia';
import { UserService } from '../services/user.service';

export const userRoute = new Elysia({ prefix: '/users' })
  .get('/', async () => {
    try {
      const allUsers = await UserService.getAll();
      return { data: allUsers };
    } catch (err: any) {
      return { data: [], message: err.message ?? 'Database query error' };
    }
  })
  .get('/:id', async ({ params: { id }, set }) => {
    try {
      const user = await UserService.getById(Number(id));
      if (!user) {
        set.status = 404;
        return { message: 'User not found' };
      }
      return { data: user };
    } catch (err: any) {
      set.status = 500;
      return { message: err.message ?? 'Database query error' };
    }
  }, {
    params: t.Object({
      id: t.Numeric()
    })
  })
  .post('/', async ({ body, set }) => {
    try {
      const res = await UserService.create(body);
      set.status = 201;
      return res;
    } catch (err: any) {
      set.status = 500;
      return { success: false, message: err.message ?? 'Database error' };
    }
  }, {
    body: t.Object({
      name: t.String({ minLength: 1 }),
      email: t.String({ format: 'email' })
    })
  });
