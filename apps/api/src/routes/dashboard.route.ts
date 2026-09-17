import { Elysia, t } from 'elysia';
import { DashboardService } from '../services/dashboard.service';
import { authContext, requireAuth, resolveUnorScope } from '../middleware/auth';
import type { UsulanStatus } from '@usul-data/shared';

export const dashboardRoute = new Elysia({ prefix: '/dashboard' })
  .use(authContext)
  .use(requireAuth)
  .use(resolveUnorScope)

  // GET /api/dashboard/stats - Statistik dashboard ringkasan usulan
  .get(
    '/stats',
    async ({ query, scopeUnor }) => {
      try {
        const stats = await DashboardService.getStats({
          tahun: query.tahun ? Number(query.tahun) : null,
          bulan: query.bulan ? Number(query.bulan) : null,
          kodeUnor: query.kode_unor ?? null,
          status: (query.status as UsulanStatus) ?? null,
          scopeUnor
        });

        return {
          success: true,
          data: stats
        };
      } catch (err: any) {
        return {
          success: false,
          data: null,
          message: err.message ?? 'Gagal mengambil data statistik dashboard'
        };
      }
    },
    {
      query: t.Object({
        tahun: t.Optional(t.String()),
        bulan: t.Optional(t.String()),
        kode_unor: t.Optional(t.String()),
        status: t.Optional(t.String())
      })
    }
  )

  // GET /api/dashboard/export - Export laporan usulan ke file Excel (.xlsx)
  .get(
    '/export',
    async ({ query, scopeUnor, set }) => {
      try {
        const buffer = await DashboardService.generateExcelReport({
          tahun: query.tahun ? Number(query.tahun) : null,
          bulan: query.bulan ? Number(query.bulan) : null,
          kodeUnor: query.kode_unor ?? null,
          status: (query.status as UsulanStatus) ?? null,
          scopeUnor
        });

        const filename = `laporan-usulan-${Date.now()}.xlsx`;
        set.headers['Content-Type'] =
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        set.headers['Content-Disposition'] = `attachment; filename="${filename}"`;

        return buffer;
      } catch (err: any) {
        set.status = 500;
        return {
          success: false,
          message: err.message ?? 'Gagal membuat file export Excel'
        };
      }
    },
    {
      query: t.Object({
        tahun: t.Optional(t.String()),
        bulan: t.Optional(t.String()),
        kode_unor: t.Optional(t.String()),
        status: t.Optional(t.String())
      })
    }
  );
