import { authState } from '$lib/stores/auth.svelte';

export interface UnorItem {
	id: number;
	kodeUnor: string;
	namaUnor: string;
}

export interface PegawaiItem {
	id: number;
	nip: string;
	nama: string;
	jabatan: string;
	kodeUnor: string;
	namaUnor?: string | null;
}

function getAuthHeaders(): HeadersInit {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};
	if (authState.token) {
		headers['Authorization'] = `Bearer ${authState.token}`;
	}
	return headers;
}

export async function fetchPegawaiList(params?: {
	kode_unor?: string;
	search?: string;
}): Promise<{ success: boolean; data: PegawaiItem[]; message?: string }> {
	try {
		const searchParams = new URLSearchParams();
		if (params?.kode_unor) searchParams.set('kode_unor', params.kode_unor);
		if (params?.search) searchParams.set('search', params.search);

		const url = `/api/pegawai${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
		const res = await fetch(url, {
			headers: getAuthHeaders(),
			credentials: 'include'
		});
		return await res.json();
	} catch (err: any) {
		return { success: false, data: [], message: err.message || 'Gagal memuat data pegawai' };
	}
}

export async function fetchPegawaiDetail(
	id: number | string
): Promise<{ success: boolean; data?: PegawaiItem; message?: string }> {
	try {
		const res = await fetch(`/api/pegawai/${id}`, {
			headers: getAuthHeaders(),
			credentials: 'include'
		});
		return await res.json();
	} catch (err: any) {
		return { success: false, message: err.message || 'Gagal memuat detail pegawai' };
	}
}

export async function createPegawai(payload: {
	nip: string;
	nama: string;
	jabatan: string;
	kodeUnor: string;
}): Promise<{ success: boolean; message?: string; data?: any }> {
	try {
		const res = await fetch('/api/pegawai', {
			method: 'POST',
			headers: getAuthHeaders(),
			body: JSON.stringify(payload),
			credentials: 'include'
		});
		return await res.json();
	} catch (err: any) {
		return { success: false, message: err.message || 'Gagal menambahkan pegawai' };
	}
}

export async function updatePegawai(
	id: number | string,
	payload: {
		nip?: string;
		nama?: string;
		jabatan?: string;
		kodeUnor?: string;
	}
): Promise<{ success: boolean; message?: string; data?: any }> {
	try {
		const res = await fetch(`/api/pegawai/${id}`, {
			method: 'PUT',
			headers: getAuthHeaders(),
			body: JSON.stringify(payload),
			credentials: 'include'
		});
		return await res.json();
	} catch (err: any) {
		return { success: false, message: err.message || 'Gagal memperbarui pegawai' };
	}
}

export async function deletePegawai(
	id: number | string
): Promise<{ success: boolean; message?: string }> {
	try {
		const res = await fetch(`/api/pegawai/${id}`, {
			method: 'DELETE',
			headers: getAuthHeaders(),
			credentials: 'include'
		});
		return await res.json();
	} catch (err: any) {
		return { success: false, message: err.message || 'Gagal menghapus pegawai' };
	}
}

export async function fetchUnorList(): Promise<{
	success: boolean;
	data: UnorItem[];
	message?: string;
}> {
	try {
		const res = await fetch('/api/unor', {
			headers: getAuthHeaders(),
			credentials: 'include'
		});
		return await res.json();
	} catch (err: any) {
		return { success: false, data: [], message: err.message || 'Gagal memuat data unor' };
	}
}
