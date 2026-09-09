import { UserService } from './user.service';
import type { UserRole } from '@usul-data/shared';

export interface AuthSessionUser {
  id: number;
  username: string;
  role: UserRole;
  kodeUnor: string | null;
}

export class AuthService {
  static async login(username: string, password: string): Promise<{
    success: boolean;
    message?: string;
    user?: AuthSessionUser;
  }> {
    const user = await UserService.getByUsername(username);
    if (!user) {
      return { success: false, message: 'Username atau password salah' };
    }

    const isValid = await Bun.password.verify(password, user.passwordHash);
    if (!isValid) {
      return { success: false, message: 'Username atau password salah' };
    }

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        kodeUnor: user.kodeUnor
      }
    };
  }

  static async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    const user = await UserService.getInternalById(userId);
    if (!user) {
      return { success: false, message: 'User tidak ditemukan' };
    }

    const isValid = await Bun.password.verify(oldPassword, user.passwordHash);
    if (!isValid) {
      return { success: false, message: 'Password lama tidak sesuai' };
    }

    if (newPassword.length < 6) {
      return { success: false, message: 'Password baru minimal 6 karakter' };
    }

    await UserService.updatePassword(userId, newPassword);
    return { success: true, message: 'Password berhasil diperbarui' };
  }
}
