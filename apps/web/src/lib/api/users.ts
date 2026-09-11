import { authState } from '$lib/stores/auth.svelte';

export interface UserItem {
	id: number;
	username: string;
	role: 'Admin' | 'AdminOPD';
	kodeUnor?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface ScopedDataResponse {
	success: boolean;
	userRole?: string;
	userKodeUnor?: string | null;
	scopeUnor?: string | null;
	isRestricted?: boolean;
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

export async function fetchUsers(): Promise<{ success: boolean; data: UserItem[]; message?: string }> {
	try {
		const res = await fetch('/api/users', {
			headers: getAuthHeaders(),
			credentials: 'include'
		});
		const data = await res.json();
		return data;
	} catch (err: any) {
		return { success: false, data: [], message: err.message || 'Gagal memuat pengguna' };
	}
}

export async function createUser(payload: {
	username: string;
	password: string;
	role?: 'Admin' | 'AdminOPD';
	kodeUnor?: string | null;
}): Promise<{ success: boolean; message?: string; data?: any }> {
	try {
		const res = await fetch('/api/users', {
			method: 'POST',
			headers: getAuthHeaders(),
			body: JSON.stringify(payload),
			credentials: 'include'
		});
		return await res.json();
	} catch (err: any) {
		return { success: false, message: err.message || 'Gagal membuat pengguna' };
	}
}

export async function updateUser(
	id: number,
	payload: {
		username?: string;
		password?: string;
		role?: 'Admin' | 'AdminOPD';
		kodeUnor?: string | null;
	}
): Promise<{ success: boolean; message?: string; data?: any }> {
	try {
		const res = await fetch(`/api/users/${id}`, {
			method: 'PUT',
			headers: getAuthHeaders(),
			body: JSON.stringify(payload),
			credentials: 'include'
		});
		return await res.json();
	} catch (err: any) {
		return { success: false, message: err.message || 'Gagal memperbarui pengguna' };
	}
}

export async function deleteUser(id: number): Promise<{ success: boolean; message?: string }> {
	try {
		const res = await fetch(`/api/users/${id}`, {
			method: 'DELETE',
			headers: getAuthHeaders(),
			credentials: 'include'
		});
		return await res.json();
	} catch (err: any) {
		return { success: false, message: err.message || 'Gagal menghapus pengguna' };
	}
}

export async function fetchScopedData(): Promise<ScopedDataResponse> {
	try {
		const res = await fetch('/api/scoped-data', {
			headers: getAuthHeaders(),
			credentials: 'include'
		});
		return await res.json();
	} catch (err: any) {
		return {
			success: false,
			message: err.message || 'Gagal memuat data scope'
		};
	}
}
