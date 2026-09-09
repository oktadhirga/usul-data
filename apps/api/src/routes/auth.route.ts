import { Elysia, t } from 'elysia';
import { AuthService } from '../services/auth.service';
import { jwtPlugin, authContext, requireAuth } from '../middleware/auth';

export const authRoute = new Elysia({ prefix: '/auth' })
  .use(jwtPlugin)
  .use(authContext)
  .post(
    '/login',
    async ({ body: { username, password }, jwt, cookie: { auth }, set }) => {
      const result = await AuthService.login(username, password);
      if (!result.success || !result.user) {
        set.status = 401;
        return {
          success: false,
          message: result.message || 'Kredensial tidak valid'
        };
      }

      const token = await jwt.sign({
        id: result.user.id,
        username: result.user.username,
        role: result.user.role,
        kodeUnor: result.user.kodeUnor
      });

      auth.set({
        value: token,
        httpOnly: true,
        path: '/',
        maxAge: 7 * 24 * 60 * 60 // 7 hari
      });

      return {
        success: true,
        token,
        user: result.user
      };
    },
    {
      body: t.Object({
        username: t.String({ minLength: 1 }),
        password: t.String({ minLength: 1 })
      })
    }
  )
  .post('/logout', ({ cookie: { auth } }) => {
    auth.remove();
    return {
      success: true,
      message: 'Logout berhasil'
    };
  })
  .use(requireAuth)
  .get('/me', ({ user }) => {
    return {
      success: true,
      user
    };
  })
  .post(
    '/change-password',
    async ({ user, body: { oldPassword, newPassword }, set }) => {
      if (!user) {
        set.status = 401;
        return { success: false, message: 'Unauthorized' };
      }

      const res = await AuthService.changePassword(user.id, oldPassword, newPassword);
      if (!res.success) {
        set.status = 400;
      }
      return res;
    },
    {
      body: t.Object({
        oldPassword: t.String({ minLength: 1 }),
        newPassword: t.String({ minLength: 6 })
      })
    }
  );
