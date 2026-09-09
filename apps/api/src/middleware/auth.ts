import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import type { UserRole } from '@usul-data/shared';

export interface AuthUser {
  id: number;
  username: string;
  role: UserRole;
  kodeUnor: string | null;
}

export const jwtPlugin = jwt({
  name: 'jwt',
  secret: process.env.JWT_SECRET || 'supersecret_usul_data_jwt_key_change_in_production'
});

export const authContext = new Elysia({ name: 'auth-context' })
  .use(jwtPlugin)
  .derive({ as: 'scoped' }, async ({ jwt, headers, cookie: { auth } }) => {
    const authHeader = headers['authorization'];
    let token = '';
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    } else if (auth?.value) {
      token = String(auth.value);
    }

    if (!token) {
      return { user: null as AuthUser | null };
    }

    try {
      const payload = await jwt.verify(token);
      if (!payload || typeof payload !== 'object') {
        return { user: null as AuthUser | null };
      }

      return {
        user: {
          id: Number(payload.id),
          username: String(payload.username),
          role: payload.role as UserRole,
          kodeUnor: (payload.kodeUnor as string) ?? null
        } as AuthUser
      };
    } catch {
      return { user: null as AuthUser | null };
    }
  });

export const requireAuth = new Elysia({ name: 'require-auth' })
  .use(authContext)
  .onBeforeHandle({ as: 'scoped' }, ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return {
        success: false,
        message: 'Unauthorized: Token autentikasi tidak valid atau belum login'
      };
    }
  });

export const createRoleGuard = (allowedRoles: UserRole[]) =>
  new Elysia({ name: `require-role-${allowedRoles.join('-')}` })
    .use(authContext)
    .onBeforeHandle({ as: 'scoped' }, ({ user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          success: false,
          message: 'Unauthorized: Token autentikasi tidak valid atau belum login'
        };
      }
      if (!allowedRoles.includes(user.role)) {
        set.status = 403;
        return {
          success: false,
          message: 'Forbidden: Role akun tidak memiliki izin akses'
        };
      }
    });

export const resolveUnorScope = new Elysia({ name: 'resolve-unor-scope' })
  .use(authContext)
  .derive({ as: 'scoped' }, ({ user }) => {
    if (!user) {
      return {
        user: null as AuthUser | null,
        scopeUnor: null as string | null
      };
    }
    // Jika role AdminOPD, otomatis sematkan kode_unor user ke scopeUnor
    // Jika role Admin, scopeUnor null (akses seluruh data / tanpa filter unit)
    const scopeUnor = user.role === 'AdminOPD' ? (user.kodeUnor ?? null) : null;
    return {
      user,
      scopeUnor
    };
  });

