import { Elysia, t } from 'elysia';
import { PegawaiService } from '../services/pegawai.service';
import { authContext, requireAuth, resolveUnorScope } from '../middleware/auth';

export const pegawaiRoute = new Elysia({ prefix: '/pegawai' })
  .use(authContext)
  .use(requireAuth)
  .use(resolveUnorScope)
  // GET /api/pegawai - Daftar Pegawai dengan filter kode_unor & pencarian nama/nip
  .get(
    '/',
    async ({ query, scopeUnor }) => {
      try {
        const data = await PegawaiService.getAll({
          kodeUnor: query.kode_unor ?? null,
          search: query.search ?? null,
          scopeUnor
        });
        return { success: true, data };
      } catch (err: any) {
        return { success: false, data: [], message: err.message ?? 'Database query error' };
      }
    },
    {
      query: t.Object({
        kode_unor: t.Optional(t.String()),
        search: t.Optional(t.String())
      })
    }
  )
  // GET /api/pegawai/:id - Detail data pegawai lengkap dengan nama_unor
  .get(
    '/:id',
    async ({ params: { id }, scopeUnor, set }) => {
      try {
        const item = await PegawaiService.getById(Number(id), scopeUnor);
        if (!item) {
          set.status = 404;
          return { success: false, message: 'Data pegawai tidak ditemukan' };
        }
        return { success: true, data: item };
      } catch (err: any) {
        if (err.message?.includes('Forbidden')) {
          set.status = 403;
          return { success: false, message: err.message };
        }
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
  // POST /api/pegawai - Tambah data pegawai baru
  .post(
    '/',
    async ({ body, user, set }) => {
      try {
        if (!user) {
          set.status = 401;
          return { success: false, message: 'Unauthorized' };
        }

        const res = await PegawaiService.create(
          {
            nip: body.nip,
            nama: body.nama,
            jabatan: body.jabatan,
            kodeUnor: body.kodeUnor
          },
          user
        );
        set.status = 201;
        return res;
      } catch (err: any) {
        if (err.message?.includes('Forbidden')) {
          set.status = 403;
        } else {
          set.status = 400;
        }
        return { success: false, message: err.message ?? 'Gagal menambahkan pegawai' };
      }
    },
    {
      body: t.Object({
        nip: t.String({ minLength: 5 }),
        nama: t.String({ minLength: 2 }),
        jabatan: t.String({ minLength: 2 }),
        kodeUnor: t.String({ minLength: 1 })
      })
    }
  )
  // PUT /api/pegawai/:id - Perbarui data pegawai
  .put(
    '/:id',
    async ({ params: { id }, body, user, set }) => {
      try {
        if (!user) {
          set.status = 401;
          return { success: false, message: 'Unauthorized' };
        }

        const res = await PegawaiService.update(
          Number(id),
          {
            nip: body.nip,
            nama: body.nama,
            jabatan: body.jabatan,
            kodeUnor: body.kodeUnor
          },
          user
        );
        return res;
      } catch (err: any) {
        if (err.message?.includes('Forbidden')) {
          set.status = 403;
        } else {
          set.status = 400;
        }
        return { success: false, message: err.message ?? 'Gagal memperbarui pegawai' };
      }
    },
    {
      params: t.Object({
        id: t.Numeric()
      }),
      body: t.Object({
        nip: t.Optional(t.String({ minLength: 5 })),
        nama: t.Optional(t.String({ minLength: 2 })),
        jabatan: t.Optional(t.String({ minLength: 2 })),
        kodeUnor: t.Optional(t.String({ minLength: 1 }))
      })
    }
  )
  // DELETE /api/pegawai/:id - Hapus data pegawai
  .delete(
    '/:id',
    async ({ params: { id }, user, set }) => {
      try {
        if (!user) {
          set.status = 401;
          return { success: false, message: 'Unauthorized' };
        }

        const res = await PegawaiService.delete(Number(id), user);
        return res;
      } catch (err: any) {
        if (err.message?.includes('Forbidden')) {
          set.status = 403;
        } else {
          set.status = 400;
        }
        return { success: false, message: err.message ?? 'Gagal menghapus pegawai' };
      }
    },
    {
      params: t.Object({
        id: t.Numeric()
      })
    }
  );
