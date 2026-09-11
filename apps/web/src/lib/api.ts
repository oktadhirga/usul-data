import type { Unor, Pegawai, UserProfile } from './types/kepegawaian';

const API_BASE = 'http://localhost:3000/api';

export const DEMO_USERS: UserProfile[] = [
  {
    id: 1,
    username: 'admin_pusat',
    role: 'Admin',
    kodeUnor: null
  },
  {
    id: 2,
    username: 'opd_dinkes',
    role: 'AdminOPD',
    kodeUnor: 'UNOR-DINKES'
  },
  {
    id: 3,
    username: 'opd_bappeda',
    role: 'AdminOPD',
    kodeUnor: 'UNOR-BAPPEDA'
  }
];

export const INITIAL_UNOR: Unor[] = [
  {
    id: 1,
    kodeUnor: 'UNOR-DINKES',
    namaUnor: 'Dinas Kesehatan'
  },
  {
    id: 2,
    kodeUnor: 'UNOR-BAPPEDA',
    namaUnor: 'Badan Perencanaan Pembangunan Daerah'
  },
  {
    id: 3,
    kodeUnor: 'UNOR-DISDIK',
    namaUnor: 'Dinas Pendidikan dan Kebudayaan'
  },
  {
    id: 4,
    kodeUnor: 'UNOR-DISKOMINFO',
    namaUnor: 'Dinas Komunikasi dan Informatika'
  }
];

export const INITIAL_PEGAWAI: Pegawai[] = [
  {
    id: 1,
    nip: '198205152008011002',
    nama: 'Dr. Hendra Wijaya, Sp.PK',
    jabatan: 'Kepala Bidang Pelayanan Kesehatan',
    kodeUnor: 'UNOR-DINKES',
    namaUnor: 'Dinas Kesehatan'
  },
  {
    id: 2,
    nip: '198711202010012004',
    nama: 'Ns. Ratna Sari, S.Kep',
    jabatan: 'Penyelia Mutu Pelayanan Medis',
    kodeUnor: 'UNOR-DINKES',
    namaUnor: 'Dinas Kesehatan'
  },
  {
    id: 3,
    nip: '198403102009011001',
    nama: 'Bambang Sudarmono, S.T., M.Si',
    jabatan: 'Kepala Bidang Infrastruktur & Tata Ruang',
    kodeUnor: 'UNOR-BAPPEDA',
    namaUnor: 'Badan Perencanaan Pembangunan Daerah'
  },
  {
    id: 4,
    nip: '199108142015022003',
    nama: 'Anita Kusuma, S.E., M.Ec.Dev',
    jabatan: 'Perencana Pembangunan Ahli Muda',
    kodeUnor: 'UNOR-BAPPEDA',
    namaUnor: 'Badan Perencanaan Pembangunan Daerah'
  },
  {
    id: 5,
    nip: '197902182005011003',
    nama: 'Drs. Supriyanto, M.Pd',
    jabatan: 'Kepala Seksi Kurikulum Pendidikan Dasar',
    kodeUnor: 'UNOR-DISDIK',
    namaUnor: 'Dinas Pendidikan dan Kebudayaan'
  },
  {
    id: 6,
    nip: '199304252019031002',
    nama: 'Rian Pratama, S.Kom',
    jabatan: 'Pranata Komputer Ahli Pertama',
    kodeUnor: 'UNOR-DISKOMINFO',
    namaUnor: 'Dinas Komunikasi dan Informatika'
  }
];

// Fallback In-Memory State untuk kemudahan preview
let memoryPegawai: Pegawai[] = [...INITIAL_PEGAWAI];
let memoryUnor: Unor[] = [...INITIAL_UNOR];

export function getActiveUser(): UserProfile {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('active_demo_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
  }
  return DEMO_USERS[0];
}

export function setActiveUser(user: UserProfile) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('active_demo_user', JSON.stringify(user));
    window.dispatchEvent(new Event('user-changed'));
  }
}

export async function fetchUnorList(): Promise<Unor[]> {
  const currentUser = getActiveUser();
  try {
    const res = await fetch(`${API_BASE}/unor`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      }
    }
  } catch {}

  // Fallback memory state dengan scoping
  if (currentUser.role === 'AdminOPD' && currentUser.kodeUnor) {
    return memoryUnor.filter((u) => u.kodeUnor === currentUser.kodeUnor);
  }
  return [...memoryUnor];
}

export async function fetchPegawaiList(filters?: {
  kodeUnor?: string;
  search?: string;
}): Promise<Pegawai[]> {
  const currentUser = getActiveUser();
  const effectiveKodeUnor = currentUser.role === 'AdminOPD' ? currentUser.kodeUnor : filters?.kodeUnor;

  try {
    const query = new URLSearchParams();
    if (effectiveKodeUnor) query.set('kode_unor', effectiveKodeUnor);
    if (filters?.search) query.set('search', filters.search);

    const res = await fetch(`${API_BASE}/pegawai?${query.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      }
    }
  } catch {}

  // Fallback memory state
  let result = memoryPegawai.map((p) => {
    const matchedUnor = memoryUnor.find((u) => u.kodeUnor === p.kodeUnor);
    return {
      ...p,
      namaUnor: matchedUnor?.namaUnor || p.namaUnor || p.kodeUnor
    };
  });

  if (effectiveKodeUnor) {
    result = result.filter((p) => p.kodeUnor === effectiveKodeUnor);
  }

  if (filters?.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    result = result.filter(
      (p) =>
        p.nama.toLowerCase().includes(q) ||
        p.nip.includes(q) ||
        p.jabatan.toLowerCase().includes(q)
    );
  }

  return result;
}

export async function fetchPegawaiById(id: number): Promise<Pegawai | null> {
  const currentUser = getActiveUser();
  try {
    const res = await fetch(`${API_BASE}/pegawai/${id}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    }
  } catch {}

  const found = memoryPegawai.find((p) => p.id === id);
  if (!found) return null;

  if (currentUser.role === 'AdminOPD' && currentUser.kodeUnor && found.kodeUnor !== currentUser.kodeUnor) {
    throw new Error('Forbidden: Anda tidak memiliki hak akses untuk melihat pegawai unit lain');
  }

  const matchedUnor = memoryUnor.find((u) => u.kodeUnor === found.kodeUnor);
  return {
    ...found,
    namaUnor: matchedUnor?.namaUnor || found.kodeUnor
  };
}

export async function createPegawai(data: {
  nip: string;
  nama: string;
  jabatan: string;
  kodeUnor: string;
}): Promise<{ success: boolean; message?: string }> {
  const currentUser = getActiveUser();
  if (currentUser.role === 'AdminOPD' && currentUser.kodeUnor && data.kodeUnor !== currentUser.kodeUnor) {
    throw new Error('Forbidden: Anda hanya dapat menambahkan pegawai di Unit Organisasi Anda');
  }

  try {
    const res = await fetch(`${API_BASE}/pegawai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      const body = await res.json();
      return body;
    }
  } catch {}

  // Fallback memory state
  const matchedUnor = memoryUnor.find((u) => u.kodeUnor === data.kodeUnor);
  const newId = memoryPegawai.length > 0 ? Math.max(...memoryPegawai.map((p) => p.id)) + 1 : 1;
  const newRecord: Pegawai = {
    id: newId,
    nip: data.nip,
    nama: data.nama,
    jabatan: data.jabatan,
    kodeUnor: data.kodeUnor,
    namaUnor: matchedUnor?.namaUnor || data.kodeUnor
  };

  memoryPegawai.push(newRecord);
  return { success: true, message: 'Pegawai berhasil ditambahkan' };
}

export async function updatePegawai(
  id: number,
  data: Partial<Omit<Pegawai, 'id' | 'namaUnor'>>
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/pegawai/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      const body = await res.json();
      return body;
    }
  } catch {}

  // Fallback memory state
  const index = memoryPegawai.findIndex((p) => p.id === id);
  if (index === -1) {
    throw new Error('Pegawai tidak ditemukan');
  }

  const updated = { ...memoryPegawai[index], ...data };
  if (data.kodeUnor) {
    const matchedUnor = memoryUnor.find((u) => u.kodeUnor === data.kodeUnor);
    updated.namaUnor = matchedUnor?.namaUnor || data.kodeUnor;
  }
  memoryPegawai[index] = updated;

  return { success: true, message: 'Pegawai berhasil diperbarui' };
}

export async function deletePegawai(id: number): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/pegawai/${id}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      const body = await res.json();
      return body;
    }
  } catch {}

  // Fallback memory state
  memoryPegawai = memoryPegawai.filter((p) => p.id !== id);
  return { success: true, message: 'Pegawai berhasil dihapus' };
}
