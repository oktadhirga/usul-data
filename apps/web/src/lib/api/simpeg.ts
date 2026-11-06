import { authState } from '$lib/stores/auth.svelte';

export interface SyncErrorItem {
	identifier: string;
	message: string;
}

export interface SimpegSyncResult {
	success: boolean;
	target: 'unor' | 'pegawai';
	totalFetched: number;
	totalUpserted: number;
	errors: SyncErrorItem[];
	syncedAt: string;
}

export interface SimpegApiResponse {
	success: boolean;
	data?: SimpegSyncResult;
	message?: string;
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

export async function syncSimpegUnor(): Promise<SimpegApiResponse> {
	try {
		const res = await fetch('/api/simpeg/unor/sync', {
			method: 'POST',
			headers: getAuthHeaders(),
			credentials: 'include'
		});
		return await res.json();
	} catch (err: any) {
		return {
			success: false,
			message: err.message || 'Gagal melakukan sinkronisasi UNOR dari SIMPEG'
		};
	}
}

export async function getSimpegUnorStatus(): Promise<SimpegApiResponse> {
	try {
		const res = await fetch('/api/simpeg/unor/status', {
			method: 'GET',
			headers: getAuthHeaders(),
			credentials: 'include'
		});
		return await res.json();
	} catch (err: any) {
		return {
			success: false,
			message: err.message || 'Gagal memuat status sinkronisasi UNOR'
		};
	}
}

export async function syncSimpegPegawai(): Promise<SimpegApiResponse> {
	try {
		const res = await fetch('/api/simpeg/pegawai/sync', {
			method: 'POST',
			headers: getAuthHeaders(),
			credentials: 'include'
		});
		return await res.json();
	} catch (err: any) {
		return {
			success: false,
			message: err.message || 'Gagal melakukan sinkronisasi Pegawai dari SIMPEG'
		};
	}
}

export async function getSimpegPegawaiStatus(): Promise<SimpegApiResponse> {
	try {
		const res = await fetch('/api/simpeg/pegawai/status', {
			method: 'GET',
			headers: getAuthHeaders(),
			credentials: 'include'
		});
		return await res.json();
	} catch (err: any) {
		return {
			success: false,
			message: err.message || 'Gagal memuat status sinkronisasi Pegawai'
		};
	}
}

