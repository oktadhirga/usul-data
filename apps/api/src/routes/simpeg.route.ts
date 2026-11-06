import { Elysia } from 'elysia';
import { SimpegSyncService } from '../services/simpeg-sync.service';
import { authContext, requireAuth } from '../middleware/auth';

export const simpegRoute = new Elysia({ prefix: '/simpeg' })
  .use(authContext)
  .use(requireAuth)
  .onBeforeHandle(({ user, set }) => {
    if (user?.role !== 'Admin') {
      set.status = 403;
      return {
        success: false,
        message: 'Forbidden: Hanya Admin Pusat yang diizinkan melakukan sinkronisasi SIMPEG'
      };
    }
  })
  // POST /api/simpeg/unor/sync - Pemicu sinkronisasi manual UNOR
  .post('/unor/sync', async () => {
    const result = await SimpegSyncService.syncUnor();
    return {
      success: result.success,
      data: result,
      message: result.success
        ? `Sinkronisasi UNOR berhasil (${result.totalUpserted} unit organisasi)`
        : `Sinkronisasi UNOR selesai dengan ${result.errors.length} peringatan`
    };
  })
  // GET /api/simpeg/unor/status - Status sinkronisasi UNOR terakhir
  .get('/unor/status', async () => {
    const data = await SimpegSyncService.getLastUnorSyncStatus();
    return {
      success: true,
      data
    };
  })
  // POST /api/simpeg/pegawai/sync - Pemicu sinkronisasi manual Pegawai
  .post('/pegawai/sync', async () => {
    const result = await SimpegSyncService.syncPegawai();
    return {
      success: result.success,
      data: result,
      message: result.success
        ? `Sinkronisasi Pegawai berhasil (${result.totalUpserted} pegawai)`
        : `Sinkronisasi Pegawai selesai dengan ${result.errors.length} peringatan`
    };
  })
  // GET /api/simpeg/pegawai/status - Status sinkronisasi Pegawai terakhir
  .get('/pegawai/status', async () => {
    const data = await SimpegSyncService.getLastPegawaiSyncStatus();
    return {
      success: true,
      data
    };
  });
