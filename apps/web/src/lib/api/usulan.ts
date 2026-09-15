import { authState } from '$lib/stores/auth.svelte';

export type UsulanStatus = 'draft' | 'diajukan' | 'dibatalkan' | 'disetujui' | 'ditolak';
export type JenisUsulan = 'tambah' | 'ubah' | 'hapus';
export type KategoriUbah =
	| 'Data Pribadi'
	| 'Data Keluarga'
	| 'Golongan'
	| 'Jabatan'
	| 'Pendidikan'
	| 'Pindah Instansi'
	| 'Diklat/Kursus';

export interface UsulanDetailField {
	id?: number;
	usulanId?: number;
	jenisUsulan: JenisUsulan;
	kategoriUbah: KategoriUbah;
	fieldName: string;
	nilaiLama?: string | null;
	nilaiBaru?: string | null;
}

export interface UsulanDokumen {
	id?: number;
	usulanId?: number;
	namaDokumen: string;
	pathFile: string;
	tipeDokumen: string;
	ukuranBytes?: number | null;
	createdAt?: string;
}

export interface UsulanItem {
	id: number;
	pegawaiId: number;
	kodeUnor: string;
	status: UsulanStatus;
	catatan?: string | null;
	createdAt: string;
	updatedAt: string;
	namaPegawai?: string | null;
	nipPegawai?: string | null;
	jabatanPegawai?: string | null;
	namaUnor?: string | null;
	details?: UsulanDetailField[];
	dokumen?: UsulanDokumen[];
}

function getAuthHeaders(isJson = true): HeadersInit {
	const headers: Record<string, string> = {};
	if (isJson) {
		headers['Content-Type'] = 'application/json';
	}
	if (authState.token) {
		headers['Authorization'] = `Bearer ${authState.token}`;
	}
	return headers;
}

export async function fetchUsulanList(params?: {
	kode_unor?: string;
	status?: string;
}): Promise<{ success: boolean; data: UsulanItem[]; message?: string }> {
	try {
		const searchParams = new URLSearchParams();
		if (params?.kode_unor) searchParams.set('kode_unor', params.kode_unor);
		if (params?.status && params.status !== 'all') searchParams.set('status', params.status);

		const url = `/api/usulan${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
		const res = await fetch(url, {
			headers: getAuthHeaders(),
			credentials: 'include'
		});
		return await res.json();
	} catch (err: any) {
		return { success: false, data: [], message: err.message || 'Gagal memuat riwayat usulan' };
	}
}

export async function fetchUsulanDetail(
	id: number | string
): Promise<{ success: boolean; data?: UsulanItem; message?: string }> {
	try {
		const res = await fetch(`/api/usulan/${id}`, {
			headers: getAuthHeaders(),
			credentials: 'include'
		});
		return await res.json();
	} catch (err: any) {
		return { success: false, message: err.message || 'Gagal memuat detail usulan' };
	}
}

export async function createUsulanDraft(payload: {
	pegawaiId: number;
	catatan?: string;
	details: {
		jenisUsulan: JenisUsulan;
		kategoriUbah: KategoriUbah;
		fieldName: string;
		nilaiLama?: string | null;
		nilaiBaru?: string | null;
	}[];
}): Promise<{ success: boolean; message?: string; data?: { id: number } }> {
	try {
		const res = await fetch('/api/usulan', {
			method: 'POST',
			headers: getAuthHeaders(true),
			body: JSON.stringify(payload),
			credentials: 'include'
		});
		return await res.json();
	} catch (err: any) {
		return { success: false, message: err.message || 'Gagal membuat draft usulan' };
	}
}

export async function uploadUsulanDokumen(
	usulanId: number | string,
	file: File,
	namaDokumen?: string
): Promise<{ success: boolean; message?: string; data?: any }> {
	try {
		const formData = new FormData();
		formData.append('file', file);
		if (namaDokumen) {
			formData.append('namaDokumen', namaDokumen);
		}

		const res = await fetch(`/api/usulan/${usulanId}/dokumen`, {
			method: 'POST',
			headers: getAuthHeaders(false),
			body: formData,
			credentials: 'include'
		});
		return await res.json();
	} catch (err: any) {
		return { success: false, message: err.message || 'Gagal mengunggah dokumen' };
	}
}

export async function submitUsulan(
	id: number | string
): Promise<{ success: boolean; message?: string }> {
	try {
		const res = await fetch(`/api/usulan/${id}/submit`, {
			method: 'POST',
			headers: getAuthHeaders(true),
			credentials: 'include'
		});
		return await res.json();
	} catch (err: any) {
		return { success: false, message: err.message || 'Gagal mengajukan usulan' };
	}
}

export async function cancelUsulan(
	id: number | string
): Promise<{ success: boolean; message?: string }> {
	try {
		const res = await fetch(`/api/usulan/${id}/cancel`, {
			method: 'POST',
			headers: getAuthHeaders(true),
			credentials: 'include'
		});
		return await res.json();
	} catch (err: any) {
		return { success: false, message: err.message || 'Gagal membatalkan usulan' };
	}
}

export async function updateUsulan(
	id: number | string,
	payload: {
		catatan?: string;
		details?: {
			jenisUsulan: JenisUsulan;
			kategoriUbah: KategoriUbah;
			fieldName: string;
			nilaiLama?: string | null;
			nilaiBaru?: string | null;
		}[];
	}
): Promise<{ success: boolean; message?: string }> {
	try {
		const res = await fetch(`/api/usulan/${id}`, {
			method: 'PUT',
			headers: getAuthHeaders(true),
			body: JSON.stringify(payload),
			credentials: 'include'
		});
		return await res.json();
	} catch (err: any) {
		return { success: false, message: err.message || 'Gagal memperbarui usulan' };
	}
}

export async function deleteUsulan(
	id: number | string
): Promise<{ success: boolean; message?: string }> {
	try {
		const res = await fetch(`/api/usulan/${id}`, {
			method: 'DELETE',
			headers: getAuthHeaders(true),
			credentials: 'include'
		});
		return await res.json();
	} catch (err: any) {
		return { success: false, message: err.message || 'Gagal menghapus usulan' };
	}
}
