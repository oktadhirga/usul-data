import { authState } from '$lib/stores/auth.svelte';

export interface NotificationItem {
	id: number;
	userId: number;
	judul: string;
	pesan: string;
	isRead: boolean;
	link: string | null;
	createdAt: string;
}

export interface NotificationsResponse {
	success: boolean;
	data: NotificationItem[];
	unreadCount: number;
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

export async function fetchNotifications(): Promise<NotificationsResponse> {
	try {
		const res = await fetch('/api/notifications', {
			headers: getAuthHeaders(),
			credentials: 'include'
		});
		return await res.json();
	} catch (err: any) {
		return {
			success: false,
			data: [],
			unreadCount: 0,
			message: err.message || 'Gagal memuat notifikasi'
		};
	}
}

export async function markNotificationAsRead(id: number): Promise<{ success: boolean; message?: string }> {
	try {
		const res = await fetch(`/api/notifications/${id}/read`, {
			method: 'PATCH',
			headers: getAuthHeaders(),
			credentials: 'include'
		});
		return await res.json();
	} catch (err: any) {
		return {
			success: false,
			message: err.message || 'Gagal menandai notifikasi dibaca'
		};
	}
}

export async function markAllNotificationsAsRead(): Promise<{ success: boolean; message?: string }> {
	try {
		const res = await fetch('/api/notifications/read-all', {
			method: 'PATCH',
			headers: getAuthHeaders(),
			credentials: 'include'
		});
		return await res.json();
	} catch (err: any) {
		return {
			success: false,
			message: err.message || 'Gagal menandai semua notifikasi dibaca'
		};
	}
}
