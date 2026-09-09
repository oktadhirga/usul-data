import { Elysia, t } from 'elysia';
import { UserService } from '../services/user.service';
import { authContext, createRoleGuard } from '../middleware/auth';
import type { UserRole } from '@usul-data/shared';

export const userRoute = new Elysia({ prefix: '/users' })
  .use(authContext)
  // Khusus Admin Pusat yang dapat mengelola akun pengguna
  .use(createRoleGuard(['Admin']))
  .get('/', async () => {
    try {
      const allUsers = await UserService.getAll();
      return { success: true, data: allUsers };
    } catch (err: any) {
      return { success: false, data: [], message: err.message ?? 'Database query error' };
    }
  })
  .get(
    '/:id',
    async ({ params: { id }, set }) => {
      try {
        const user = await UserService.getById(Number(id));
        if (!user) {
          set.status = 404;
          return { success: false, message: 'User tidak ditemukan' };
        }
        return { success: true, data: user };
      } catch (err: any) {
        set.status = 500;
        return { success: false, message: err.message ?? 'Database query error' };
      }
    },
    {
      params: t.Object({
        id: t.Numeric()
      })
    }
  )
  .post(
    '/',
    async ({ body, set }) => {
      try {
        // Validasi: jika role AdminOPD, kodeUnor disarankan/diisi
        const res = await UserService.create({
          username: body.username,
          password: body.password,
          role: body.role as UserRole,
          kodeUnor: body.kodeUnor ?? null
        });
        set.status = 201;
        return res;
      } catch (err: any) {
        set.status = 500;
        return { success: false, message: err.message ?? 'Gagal membuat user' };
      }
    },
    {
      body: t.Object({
        username: t.String({ minLength: 3 }),
        password: t.String({ minLength: 6 }),
        role: t.Optional(t.Union([t.Literal('Admin'), t.Literal('AdminOPD')])),
        kodeUnor: t.Optional(t.Nullable(t.String()))
      })
    }
  )
  .put(
    '/:id',
    async ({ params: { id }, body, set }) => {
      try {
        const res = await UserService.update(Number(id), {
          username: body.username,
          password: body.password,
          role: body.role as UserRole,
          kodeUnor: body.kodeUnor
        });
        return res;
      } catch (err: any) {
        set.status = 500;
        return { success: false, message: err.message ?? 'Gagal memperbarui user' };
      }
    },
    {
      params: t.Object({
        id: t.Numeric()
      }),
      body: t.Object({
        username: t.Optional(t.String({ minLength: 3 })),
        password: t.Optional(t.String({ minLength: 6 })),
        role: t.Optional(t.Union([t.Literal('Admin'), t.Literal('AdminOPD')])),
        kodeUnor: t.Optional(t.Nullable(t.String()))
      })
    }
  )
  .delete(
    '/:id',
    async ({ params: { id }, set }) => {
      try {
        const res = await UserService.delete(Number(id));
        return res;
      } catch (err: any) {
        set.status = 500;
        return { success: false, message: err.message ?? 'Gagal menghapus user' };
      }
    },
    {
      params: t.Object({
        id: t.Numeric()
      })
    }
  );
