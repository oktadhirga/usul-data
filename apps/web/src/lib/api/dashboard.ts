import { authState } from '$lib/stores/auth.svelte';

export interface StatusCount {
	status: string;
	count: number;
}

export interface UnorStatItem {
	kodeUnor: string;
	namaUnor: string;
	total: number;
	diajukan: number;
	disetujui: number;
	ditolak: number;
	draft: number;
	dibatalkan: number;
}

export interface KategoriStatItem {
	kategori: string;
	count: number;
}

export interface MonthlyStatItem {
	bulan: number;
	namaBulan: string;
	total: number;
	diajukan: number;
	disetujui: number;
	ditolak: number;
}

export interface DashboardStats {
	summary: {
		total: number;
		diajukan: number;
		disetujui: number;
		ditolak: number;
		draft: number;
		dibatalkan: number;
	};
	byStatus: StatusCount[];
	byUnor: UnorStatItem[];
	byKategori: KategoriStatItem[];
	monthlyTrend: MonthlyStatItem[];
	filteredPeriod: {
		tahun: number | null;
		bulan: number | null;
	};
}

export interface DashboardFilterParams {
	tahun?: number | string | null;
	bulan?: number | string | null;
	kode_unor?: string | null;
	status?: string | null;
}

function getAuthHeaders(): HeadersInit {
	const headers: Record<string, string> = {};
	if (authState.token) {
		headers['Authorization'] = `Bearer ${authState.token}`;
	}
	return headers;
}

export async function fetchDashboardStats(
	params?: DashboardFilterParams
): Promise<{ success: boolean; data: DashboardStats | null; message?: string }> {
	try {
		const searchParams = new URLSearchParams();
		if (params?.tahun) searchParams.set('tahun', String(params.tahun));
		if (params?.bulan) searchParams.set('bulan', String(params.bulan));
		if (params?.kode_unor && params.kode_unor !== 'all') {
			searchParams.set('kode_unor', params.kode_unor);
		}
		if (params?.status && params.status !== 'all') {
			searchParams.set('status', params.status);
		}

		const query = searchParams.toString();
		const url = `/api/dashboard/stats${query ? `?${query}` : ''}`;

		const res = await fetch(url, {
			headers: {
				'Content-Type': 'application/json',
				...getAuthHeaders()
			},
			credentials: 'include'
		});

		return await res.json();
	} catch (err: any) {
		return {
			success: false,
			data: null,
			message: err.message || 'Gagal memuat data statistik dashboard'
		};
	}
}

export async function downloadDashboardExcel(params?: DashboardFilterParams): Promise<boolean> {
	try {
		const searchParams = new URLSearchParams();
		if (params?.tahun) searchParams.set('tahun', String(params.tahun));
		if (params?.bulan) searchParams.set('bulan', String(params.bulan));
		if (params?.kode_unor && params.kode_unor !== 'all') {
			searchParams.set('kode_unor', params.kode_unor);
		}
		if (params?.status && params.status !== 'all') {
			searchParams.set('status', params.status);
		}

		const query = searchParams.toString();
		const url = `/api/dashboard/export${query ? `?${query}` : ''}`;

		const res = await fetch(url, {
			headers: getAuthHeaders(),
			credentials: 'include'
		});

		if (!res.ok) {
			throw new Error(`Gagal mengunduh file: ${res.statusText}`);
		}

		const blob = await res.blob();
		const downloadUrl = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = downloadUrl;

		const disposition = res.headers.get('Content-Disposition');
		let filename = 'laporan-usulan.xlsx';
		if (disposition && disposition.includes('filename=')) {
			const matches = disposition.match(/filename="?([^"]+)"?/);
			if (matches?.[1]) {
				filename = matches[1];
			}
		}

		link.download = filename;
		document.body.appendChild(link);
		link.click();
		link.remove();
		window.URL.revokeObjectURL(downloadUrl);

		return true;
	} catch (err: any) {
		console.error('Error downloading excel report:', err);
		return false;
	}
}
