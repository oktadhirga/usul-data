import type { Unor as SharedUnor, Pegawai as SharedPegawai, UserRole } from '@usul-data/shared';

export type Unor = SharedUnor;

export interface Pegawai extends SharedPegawai {
  namaUnor?: string | null;
}

export interface UserProfile {
  id: number;
  username: string;
  role: UserRole;
  kodeUnor: string | null;
}
