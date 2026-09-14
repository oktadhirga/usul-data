import { Elysia, t } from 'elysia';
import { UsulanService } from '../services/usulan.service';
import { authContext, requireAuth, resolveUnorScope } from '../middleware/auth';
import type { UsulanStatus } from '@usul-data/shared';
import path from 'path';
import fs from 'fs';

export const usulanRoute = new Elysia({ prefix: '/usulan' })
  .use(authContext)
  .use(requireAuth)
  .use(resolveUnorScope)

  // GET /api/usulan - List Usulan Perubahan dengan filter kode_unor & status
  .get(
    '/',
    async ({ query, scopeUnor }) => {
      try {
        const data = await UsulanService.getAll({
          kodeUnor: query.kode_unor ?? null,
          status: (query.status as UsulanStatus) ?? null,
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
        status: t.Optional(t.String())
      })
    }
  )

  // GET /api/usulan/:id - Detail lengkap satu usulan beserta detail field & dokumen
  .get(
    '/:id',
    async ({ params: { id }, scopeUnor, set }) => {
      try {
        const item = await UsulanService.getById(Number(id), scopeUnor);
        if (!item) {
          set.status = 404;
          return { success: false, message: 'Usulan tidak ditemukan' };
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

  // POST /api/usulan - Buat draft usulan perubahan data baru
  .post(
    '/',
    async ({ body, user, set }) => {
      try {
        if (!user) {
          set.status = 401;
          return { success: false, message: 'Unauthorized' };
        }

        const res = await UsulanService.createDraft(
          {
            pegawaiId: Number(body.pegawaiId),
            catatan: body.catatan,
            details: body.details
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
        return { success: false, message: err.message ?? 'Gagal membuat draft usulan' };
      }
    },
    {
      body: t.Object({
        pegawaiId: t.Numeric(),
        catatan: t.Optional(t.String()),
        details: t.Array(
          t.Object({
            jenisUsulan: t.Union([t.Literal('tambah'), t.Literal('ubah'), t.Literal('hapus')]),
            kategoriUbah: t.Union([
              t.Literal('Data Pribadi'),
              t.Literal('Data Keluarga'),
              t.Literal('Golongan'),
              t.Literal('Jabatan'),
              t.Literal('Pendidikan'),
              t.Literal('Pindah Instansi'),
              t.Literal('Diklat/Kursus')
            ]),
            fieldName: t.String({ minLength: 1 }),
            nilaiLama: t.Optional(t.Nullable(t.String())),
            nilaiBaru: t.Optional(t.Nullable(t.String()))
          }),
          { minItems: 1 }
        )
      })
    }
  )

  // POST /api/usulan/:id/dokumen - Upload dokumen pendukung (PDF, max 1MB)
  .post(
    '/:id/dokumen',
    async ({ params: { id }, body, user, set }) => {
      try {
        if (!user) {
          set.status = 401;
          return { success: false, message: 'Unauthorized' };
        }

        const res = await UsulanService.uploadDokumen(
          Number(id),
          body.file,
          body.namaDokumen,
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
        return { success: false, message: err.message ?? 'Gagal mengunggah dokumen' };
      }
    },
    {
      params: t.Object({
        id: t.Numeric()
      }),
      body: t.Object({
        file: t.File(),
        namaDokumen: t.Optional(t.String())
      })
    }
  )

  // POST /api/usulan/:id/submit - Submit usulan (draft -> diajukan)
  .post(
    '/:id/submit',
    async ({ params: { id }, user, set }) => {
      try {
        if (!user) {
          set.status = 401;
          return { success: false, message: 'Unauthorized' };
        }

        const res = await UsulanService.submitUsulan(Number(id), user);
        return res;
      } catch (err: any) {
        if (err.message?.includes('Forbidden')) {
          set.status = 403;
        } else {
          set.status = 400;
        }
        return { success: false, message: err.message ?? 'Gagal mengajukan usulan' };
      }
    },
    {
      params: t.Object({
        id: t.Numeric()
      })
    }
  )

  // POST /api/usulan/:id/cancel - Batalkan usulan (hanya status diajukan)
  .post(
    '/:id/cancel',
    async ({ params: { id }, user, set }) => {
      try {
        if (!user) {
          set.status = 401;
          return { success: false, message: 'Unauthorized' };
        }

        const res = await UsulanService.cancelUsulan(Number(id), user);
        return res;
      } catch (err: any) {
        if (err.message?.includes('Forbidden')) {
          set.status = 403;
        } else {
          set.status = 400;
        }
        return { success: false, message: err.message ?? 'Gagal membatalkan usulan' };
      }
    },
    {
      params: t.Object({
        id: t.Numeric()
      })
    }
  )

  // PUT /api/usulan/:id - Perbarui data usulan (status draft atau dibatalkan)
  .put(
    '/:id',
    async ({ params: { id }, body, user, set }) => {
      try {
        if (!user) {
          set.status = 401;
          return { success: false, message: 'Unauthorized' };
        }

        const res = await UsulanService.updateUsulan(
          Number(id),
          {
            catatan: body.catatan,
            details: body.details
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
        return { success: false, message: err.message ?? 'Gagal memperbarui usulan' };
      }
    },
    {
      params: t.Object({
        id: t.Numeric()
      }),
      body: t.Object({
        catatan: t.Optional(t.String()),
        details: t.Optional(
          t.Array(
            t.Object({
              jenisUsulan: t.Union([t.Literal('tambah'), t.Literal('ubah'), t.Literal('hapus')]),
              kategoriUbah: t.Union([
                t.Literal('Data Pribadi'),
                t.Literal('Data Keluarga'),
                t.Literal('Golongan'),
                t.Literal('Jabatan'),
                t.Literal('Pendidikan'),
                t.Literal('Pindah Instansi'),
                t.Literal('Diklat/Kursus')
              ]),
              fieldName: t.String({ minLength: 1 }),
              nilaiLama: t.Optional(t.Nullable(t.String())),
              nilaiBaru: t.Optional(t.Nullable(t.String()))
            })
          )
        )
      })
    }
  )

  // DELETE /api/usulan/:id - Hapus usulan secara permanen
  .delete(
    '/:id',
    async ({ params: { id }, user, set }) => {
      try {
        if (!user) {
          set.status = 401;
          return { success: false, message: 'Unauthorized' };
        }

        const res = await UsulanService.deleteUsulan(Number(id), user);
        return res;
      } catch (err: any) {
        if (err.message?.includes('Forbidden')) {
          set.status = 403;
        } else {
          set.status = 400;
        }
        return { success: false, message: err.message ?? 'Gagal menghapus usulan' };
      }
    },
    {
      params: t.Object({
        id: t.Numeric()
      })
    }
  );

// Helper untuk menemukan lokasi file upload di berbagai konteks eksekusi (root vs apps/api)
function resolveUploadedFilePath(filename: string): string | null {
  const sanitized = path.basename(filename);
  const candidates = [
    path.resolve(process.cwd(), 'uploads', sanitized),
    path.resolve(process.cwd(), 'apps/api/uploads', sanitized),
    path.resolve(import.meta.dir, '../../uploads', sanitized),
    path.resolve(import.meta.dir, '../../../uploads', sanitized)
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

// Route untuk melihat/download file upload (dengan prefix terpisah atau /uploads)
export const uploadsRoute = new Elysia({ prefix: '/uploads' })
  .get('/:filename', ({ params: { filename }, set }) => {
    const filePath = resolveUploadedFilePath(filename);

    if (!filePath) {
      set.status = 404;
      return { success: false, message: 'Berkas tidak ditemukan' };
    }

    set.headers['Content-Type'] = 'application/pdf';
    set.headers['Content-Disposition'] = `inline; filename="${path.basename(filePath)}"`;
    return Bun.file(filePath);
  });
