import { Elysia } from 'elysia';
import { healthRoute } from './health.route';
import { userRoute } from './user.route';
import { authRoute } from './auth.route';
import { unorRoute } from './unor.route';
import { pegawaiRoute } from './pegawai.route';
import { usulanRoute, uploadsRoute } from './usulan.route';
import { notificationRoute } from './notification.route';
import { dashboardRoute } from './dashboard.route';
import { authContext, requireAuth, resolveUnorScope } from '../middleware/auth';


export const appRoutes = new Elysia({ prefix: '/api' })
  .use(healthRoute)
  .use(authRoute)
  .use(userRoute)
  .use(unorRoute)
  .use(pegawaiRoute)
  .use(usulanRoute)
  .use(uploadsRoute)
  .use(notificationRoute)
  .use(dashboardRoute)
  // Demo endpoint untuk memverifikasi scoping kode_unor (resolveUnorScope)
  .use(authContext)
  .use(requireAuth)
  .use(resolveUnorScope)
  .get('/scoped-data', ({ user, scopeUnor }) => {
    return {
      success: true,
      userRole: user?.role,
      userKodeUnor: user?.kodeUnor,
      scopeUnor,
      isRestricted: user?.role === 'AdminOPD',
      message:
        user?.role === 'Admin'
          ? 'Admin Pusat: Akses seluruh data OPD'
          : `Admin OPD: Data dibatasi untuk kode UNOR ${scopeUnor}`
    };
  });

