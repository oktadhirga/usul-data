import { Elysia, t } from 'elysia';
import { UnorService } from '../services/unor.service';
import { authContext, requireAuth, resolveUnorScope, createRoleGuard } from '../middleware/auth';

export const unorRoute = new Elysia({ prefix: '/unor' })
  .use(authContext)
  .use(requireAuth)
  .use(resolveUnorScope)
  // GET /api/unor - List UNOR (Scoped jika AdminOPD, All jika Admin)
  .get('/', async ({ scopeUnor }) => {
    try {
      const data = await UnorService.getAll(scopeUnor);
      return { success: true, data };
    } catch (err: any) {
      return { success: false, data: [], message: err.message ?? 'Database query error' };
    }
  })
  // GET /api/unor/:id - Detail UNOR
  .get(
    '/:id',
    async ({ params: { id }, scopeUnor, set }) => {
      try {
        const item = await UnorService.getById(Number(id));
        if (!item) {
          set.status = 404;
          return { success: false, message: 'Unit Organisasi tidak ditemukan' };
        }

        // Jika AdminOPD, pastikan hanya mengakses UNOR miliknya
        if (scopeUnor && item.kodeUnor !== scopeUnor) {
          set.status = 403;
          return { success: false, message: 'Forbidden: Anda tidak memiliki akses ke Unit Organisasi ini' };
        }

        return { success: true, data: item };
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
    async ({ body, user, set }) => {
      if (!user || user.role !== 'Admin') {
        set.status = 403;
        return {
          success: false,
          message: 'Forbidden: Hanya Admin Pusat yang dapat mengelola master Unit Organisasi'
        };
      }

      try {
        const res = await UnorService.create({
          kodeUnor: body.kodeUnor,
          namaUnor: body.namaUnor
        });
        set.status = 201;
        return res;
      } catch (err: any) {
        set.status = 400;
        return { success: false, message: err.message ?? 'Gagal menambahkan Unit Organisasi' };
      }
    },
    {
      body: t.Object({
        kodeUnor: t.String({ minLength: 1 }),
        namaUnor: t.String({ minLength: 1 })
      })
    }
  )
  .put(
    '/:id',
    async ({ params: { id }, body, user, set }) => {
      if (!user || user.role !== 'Admin') {
        set.status = 403;
        return {
          success: false,
          message: 'Forbidden: Hanya Admin Pusat yang dapat mengelola master Unit Organisasi'
        };
      }

      try {
        const res = await UnorService.update(Number(id), {
          kodeUnor: body.kodeUnor,
          namaUnor: body.namaUnor
        });
        return res;
      } catch (err: any) {
        set.status = 400;
        return { success: false, message: err.message ?? 'Gagal memperbarui Unit Organisasi' };
      }
    },
    {
      params: t.Object({
        id: t.Numeric()
      }),
      body: t.Object({
        kodeUnor: t.Optional(t.String({ minLength: 1 })),
        namaUnor: t.Optional(t.String({ minLength: 1 }))
      })
    }
  )
  .delete(
    '/:id',
    async ({ params: { id }, user, set }) => {
      if (!user || user.role !== 'Admin') {
        set.status = 403;
        return {
          success: false,
          message: 'Forbidden: Hanya Admin Pusat yang dapat mengelola master Unit Organisasi'
        };
      }

      try {
        const res = await UnorService.delete(Number(id));
        return res;
      } catch (err: any) {
        set.status = 400;
        return { success: false, message: err.message ?? 'Gagal menghapus Unit Organisasi' };
      }
    },
    {
      params: t.Object({
        id: t.Numeric()
      })
    }
  );

