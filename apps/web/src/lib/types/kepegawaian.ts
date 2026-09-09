export interface Unor {
  id: number;
  kodeUnor: string;
  namaUnor: string;
}

export interface Pegawai {
  id: number;
  nip: string;
  nama: string;
  jabatan: string;
  kodeUnor: string;
  namaUnor?: string;
}

export interface UserProfile {
  id: number;
  username: string;
  role: 'Admin' | 'AdminOPD';
  kodeUnor: string | null;
}
