<script lang="ts">
	import { onMount } from 'svelte';
	import { authState } from '$lib/stores/auth.svelte';
	import { fetchScopedData, type ScopedDataResponse } from '$lib/api/users';
	import { fetchUnorList, type UnorItem } from '$lib/api/pegawai';
	import {
		fetchDashboardStats,
		downloadDashboardExcel,
		type DashboardStats
	} from '$lib/api/dashboard';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import {
		Shield,
		Building2,
		Briefcase,
		CheckCircle2,
		AlertCircle,
		XCircle,
		Clock,
		RefreshCw,
		ArrowRight,
		Download,
		FileText,
		Calendar,
		Filter,
		Loader2,
		Layers,
		Check,
		FileSpreadsheet
	} from 'lucide-svelte';

	let scopedInfo = $state<ScopedDataResponse | null>(null);
	let isLoadingScope = $state(false);
	let unorList = $state<UnorItem[]>([]);

	// Dashboard State
	let stats = $state<DashboardStats | null>(null);
	let isLoadingStats = $state(true);
	let isExporting = $state(false);
	let exportSuccess = $state(false);
	let errorMessage = $state<string | null>(null);

	// Filters
	let filterTahun = $state<string>(String(new Date().getFullYear()));
	let filterBulan = $state<string>('all');
	let filterStatus = $state<string>('all');
	let filterKodeUnor = $state<string>('all');

	const unorName = $derived(() => {
		if (authState.isAdmin) return 'Semua Unit (Pusat)';
		if (!authState.user?.kodeUnor) return 'Belum Ditugaskan';
		const found = unorList.find((u) => u.kodeUnor === authState.user?.kodeUnor);
		return found ? found.namaUnor : authState.user.kodeUnor;
	});

	const BULAN_OPTIONS = [
		{ value: 'all', label: 'Semua Bulan' },
		{ value: '1', label: 'Januari' },
		{ value: '2', label: 'Februari' },
		{ value: '3', label: 'Maret' },
		{ value: '4', label: 'April' },
		{ value: '5', label: 'Mei' },
		{ value: '6', label: 'Juni' },
		{ value: '7', label: 'Juli' },
		{ value: '8', label: 'Agustus' },
		{ value: '9', label: 'September' },
		{ value: '10', label: 'Oktober' },
		{ value: '11', label: 'November' },
		{ value: '12', label: 'Desember' }
	];

	async function loadStats() {
		isLoadingStats = true;
		errorMessage = null;
		try {
			const res = await fetchDashboardStats({
				tahun: filterTahun !== 'all' ? filterTahun : undefined,
				bulan: filterBulan !== 'all' ? filterBulan : undefined,
				status: filterStatus !== 'all' ? filterStatus : undefined,
				kode_unor: filterKodeUnor !== 'all' ? filterKodeUnor : undefined
			});

			if (res.success && res.data) {
				stats = res.data;
			} else {
				errorMessage = res.message || 'Gagal memuat data statistik';
			}
		} catch (err: any) {
			errorMessage = err.message || 'Terjadi kesalahan sistem';
		} finally {
			isLoadingStats = false;
		}
	}

	async function handleExportExcel() {
		isExporting = true;
		exportSuccess = false;
		try {
			const ok = await downloadDashboardExcel({
				tahun: filterTahun !== 'all' ? filterTahun : undefined,
				bulan: filterBulan !== 'all' ? filterBulan : undefined,
				status: filterStatus !== 'all' ? filterStatus : undefined,
				kode_unor: filterKodeUnor !== 'all' ? filterKodeUnor : undefined
			});
			if (ok) {
				exportSuccess = true;
				setTimeout(() => {
					exportSuccess = false;
				}, 3500);
			}
		} catch (err) {
			console.error('Gagal mengekspor laporan:', err);
		} finally {
			isExporting = false;
		}
	}

	async function loadScope() {
		isLoadingScope = true;
		scopedInfo = await fetchScopedData();
		isLoadingScope = false;
	}

	async function loadUnors() {
		const res = await fetchUnorList();
		if (res.success && Array.isArray(res.data)) {
			unorList = res.data;
		}
	}

	onMount(() => {
		if (authState.isAuthenticated) {
			loadScope();
			loadUnors();
			loadStats();
		}
	});

	$effect(() => {
		if (authState.isAuthenticated && !scopedInfo && !isLoadingScope) {
			loadScope();
			loadUnors();
		}
	});

	function calculatePercentage(count: number, total: number): string {
		if (!total || total === 0) return '0%';
		return `${Math.round((count / total) * 100)}%`;
	}
</script>

<svelte:head>
	<title>Dashboard Analitik & Statistik - ASN-Sync</title>
</svelte:head>

<div class="space-y-6 max-w-7xl mx-auto pb-12">
	<!-- Welcome & Overview Banner -->
	<div
		class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 dark:from-indigo-950/80 dark:via-slate-900 dark:to-slate-900 border border-indigo-500/30 dark:border-indigo-500/20 p-6 md:p-8 shadow-xl shadow-indigo-950/10"
	>
		<div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
			<div class="space-y-1.5">
				<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 dark:bg-indigo-500/10 border border-white/20 dark:border-indigo-500/30 text-white dark:text-indigo-400 text-xs font-semibold backdrop-blur-xs">
					<Shield class="h-3.5 w-3.5" />
					<span>Dashboard Utama Sistem Kepegawaian</span>
				</div>
				<h1 class="text-2xl md:text-3xl font-bold text-white tracking-tight">
					Selamat Datang, {authState.user?.username || 'Pengguna'}!
				</h1>
				<p class="text-indigo-100 dark:text-slate-400 text-sm max-w-2xl">
					Ringkasan analitik pengajuan dan verifikasi usulan perubahan data aparatur sipil negara.
					Hak akses Anda:
					<span class="font-semibold text-white dark:text-slate-200">
						{authState.isAdmin ? 'Administrator Pusat (Lintas UNOR)' : 'Administrator OPD'}
					</span>
					{#if !authState.isAdmin && authState.user?.kodeUnor}
						pada <span class="font-semibold text-emerald-300 dark:text-emerald-400">{unorName()}</span>
					{/if}.
				</p>
			</div>

			<!-- Export & Quick Actions -->
			<div class="flex items-center gap-2.5 flex-wrap">
				<Button
					variant="outline"
					size="sm"
					class="border-white/30 bg-white/10 hover:bg-white/20 text-white dark:border-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-200 text-xs h-9 gap-1.5 backdrop-blur-xs"
					onclick={loadStats}
					disabled={isLoadingStats}
				>
					<RefreshCw class={`h-3.5 w-3.5 ${isLoadingStats ? 'animate-spin' : ''}`} />
					<span>Segarkan Data</span>
				</Button>

				<Button
					size="sm"
					class="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs h-9 shadow-md shadow-emerald-600/20 gap-2 transition cursor-pointer"
					onclick={handleExportExcel}
					disabled={isExporting}
				>
					{#if isExporting}
						<Loader2 class="h-4 w-4 animate-spin text-white" />
						<span>Membuat File...</span>
					{:else if exportSuccess}
						<Check class="h-4 w-4 text-emerald-200" />
						<span>Telah Terunduh!</span>
					{:else}
						<FileSpreadsheet class="h-4 w-4 text-emerald-100" />
						<span>Ekspor Laporan (.xlsx)</span>
					{/if}
				</Button>
			</div>
		</div>
	</div>

	<!-- Interactive Filter Toolbar -->
	<Card class="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 backdrop-blur-sm">
		<CardContent class="p-4">
			<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div class="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
					<Filter class="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
					<span>Filter Periode & Unit:</span>
				</div>

				<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
					<!-- Filter Tahun -->
					<div>
						<label for="filter-tahun" class="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Tahun</label>
						<select
							id="filter-tahun"
							bind:value={filterTahun}
							onchange={loadStats}
							class="w-full h-8 px-2.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
						>
							<option value="all">Semua Tahun</option>
							<option value="2026">2026</option>
							<option value="2025">2025</option>
						</select>
					</div>

					<!-- Filter Bulan -->
					<div>
						<label for="filter-bulan" class="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Bulan</label>
						<select
							id="filter-bulan"
							bind:value={filterBulan}
							onchange={loadStats}
							class="w-full h-8 px-2.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
						>
							{#each BULAN_OPTIONS as opt}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
					</div>

					<!-- Filter Status -->
					<div>
						<label for="filter-status" class="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Status Usulan</label>
						<select
							id="filter-status"
							bind:value={filterStatus}
							onchange={loadStats}
							class="w-full h-8 px-2.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
						>
							<option value="all">Semua Status</option>
							<option value="diajukan">Menunggu Verifikasi</option>
							<option value="disetujui">Disetujui</option>
							<option value="ditolak">Ditolak</option>
							<option value="draft">Draft</option>
							<option value="dibatalkan">Dibatalkan</option>
						</select>
					</div>

					<!-- Filter UNOR (Hanya Admin Pusat) -->
					{#if authState.isAdmin}
						<div>
							<label for="filter-unor" class="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Unit Organisasi</label>
							<select
								id="filter-unor"
								bind:value={filterKodeUnor}
								onchange={loadStats}
								class="w-full h-8 px-2.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 truncate"
							>
								<option value="all">Seluruh UNOR</option>
								{#each unorList as u}
									<option value={u.kodeUnor}>{u.namaUnor}</option>
								{/each}
							</select>
						</div>
					{:else}
						<div class="flex flex-col justify-end">
							<span class="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Lingkup Unit</span>
							<div class="h-8 px-2.5 flex items-center text-xs bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-emerald-600 dark:text-emerald-400 font-mono truncate" title={authState.user?.kodeUnor || ''}>
								{authState.user?.kodeUnor || 'OPD Terbatas'}
							</div>
						</div>
					{/if}
				</div>
			</div>
		</CardContent>
	</Card>

	{#if errorMessage}
		<div class="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
			<AlertCircle class="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400" />
			<span>{errorMessage}</span>
		</div>
	{/if}

	<!-- 5 Summary KPI Cards -->
	<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
		<!-- Card 1: Total Usulan -->
		<Card class="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition">
			<div class="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition"></div>
			<CardHeader class="pb-1.5 flex flex-row items-center justify-between">
				<CardTitle class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Usulan</CardTitle>
				<FileText class="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
			</CardHeader>
			<CardContent>
				<div class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
					{#if isLoadingStats}
						<div class="h-8 w-12 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
					{:else}
						{stats?.summary.total ?? 0}
					{/if}
				</div>
				<p class="text-[11px] text-slate-500 mt-1">Keseluruhan pengajuan</p>
			</CardContent>
		</Card>

		<!-- Card 2: Menunggu Verifikasi -->
		<Card class="border-amber-200 dark:border-amber-900/30 bg-amber-50/60 dark:bg-amber-950/20 relative overflow-hidden group hover:border-amber-300 dark:hover:border-amber-700/40 transition">
			<CardHeader class="pb-1.5 flex flex-row items-center justify-between">
				<CardTitle class="text-xs font-semibold text-amber-700 dark:text-amber-400/90 uppercase">Menunggu</CardTitle>
				<Clock class="h-4 w-4 text-amber-600 dark:text-amber-400" />
			</CardHeader>
			<CardContent>
				<div class="text-3xl font-black text-amber-600 dark:text-amber-300 tracking-tight">
					{#if isLoadingStats}
						<div class="h-8 w-12 bg-amber-200 dark:bg-slate-800 rounded animate-pulse"></div>
					{:else}
						{stats?.summary.diajukan ?? 0}
					{/if}
				</div>
				<div class="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-500/80 mt-1">
					<span>{calculatePercentage(stats?.summary.diajukan ?? 0, stats?.summary.total ?? 0)} dari total</span>
				</div>
			</CardContent>
		</Card>

		<!-- Card 3: Disetujui -->
		<Card class="border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/60 dark:bg-emerald-950/20 relative overflow-hidden group hover:border-emerald-300 dark:hover:border-emerald-700/40 transition">
			<CardHeader class="pb-1.5 flex flex-row items-center justify-between">
				<CardTitle class="text-xs font-semibold text-emerald-700 dark:text-emerald-400/90 uppercase">Disetujui</CardTitle>
				<CheckCircle2 class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
			</CardHeader>
			<CardContent>
				<div class="text-3xl font-black text-emerald-600 dark:text-emerald-300 tracking-tight">
					{#if isLoadingStats}
						<div class="h-8 w-12 bg-emerald-200 dark:bg-slate-800 rounded animate-pulse"></div>
					{:else}
						{stats?.summary.disetujui ?? 0}
					{/if}
				</div>
				<div class="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-500/80 mt-1">
					<span>{calculatePercentage(stats?.summary.disetujui ?? 0, stats?.summary.total ?? 0)} selesai</span>
				</div>
			</CardContent>
		</Card>

		<!-- Card 4: Ditolak -->
		<Card class="border-rose-200 dark:border-rose-900/30 bg-rose-50/60 dark:bg-rose-950/20 relative overflow-hidden group hover:border-rose-300 dark:hover:border-rose-700/40 transition">
			<CardHeader class="pb-1.5 flex flex-row items-center justify-between">
				<CardTitle class="text-xs font-semibold text-rose-700 dark:text-rose-400/90 uppercase">Ditolak</CardTitle>
				<XCircle class="h-4 w-4 text-rose-600 dark:text-rose-400" />
			</CardHeader>
			<CardContent>
				<div class="text-3xl font-black text-rose-600 dark:text-rose-300 tracking-tight">
					{#if isLoadingStats}
						<div class="h-8 w-12 bg-rose-200 dark:bg-slate-800 rounded animate-pulse"></div>
					{:else}
						{stats?.summary.ditolak ?? 0}
					{/if}
				</div>
				<div class="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-500/80 mt-1">
					<span>{calculatePercentage(stats?.summary.ditolak ?? 0, stats?.summary.total ?? 0)} ditolak</span>
				</div>
			</CardContent>
		</Card>

		<!-- Card 5: Draft & Batal -->
		<Card class="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition col-span-2 sm:col-span-1">
			<CardHeader class="pb-1.5 flex flex-row items-center justify-between">
				<CardTitle class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Draft / Batal</CardTitle>
				<Layers class="h-4 w-4 text-slate-500 dark:text-slate-400" />
			</CardHeader>
			<CardContent>
				<div class="text-3xl font-black text-slate-800 dark:text-slate-300 tracking-tight">
					{#if isLoadingStats}
						<div class="h-8 w-12 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
					{:else}
						{(stats?.summary.draft ?? 0) + (stats?.summary.dibatalkan ?? 0)}
					{/if}
				</div>
				<p class="text-[11px] text-slate-500 mt-1">
					Draft: {stats?.summary.draft ?? 0} | Batal: {stats?.summary.dibatalkan ?? 0}
				</p>
			</CardContent>
		</Card>
	</div>

	<!-- Breakdown Section Grid: UNOR & Kategori -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
		<!-- Left: Distribusi Per Unit Organisasi (UNOR) -->
		<Card class="lg:col-span-7 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80">
			<CardHeader class="flex flex-row items-center justify-between pb-3">
				<div>
					<CardTitle class="text-base text-slate-900 dark:text-white flex items-center gap-2">
						<Building2 class="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
						<span>Distribusi Usulan per Unit Organisasi</span>
					</CardTitle>
					<CardDescription class="text-xs text-slate-500 dark:text-slate-400">
						Rekapitulasi aktivitas pengajuan usulan pegawai per unit kerja perangkat daerah.
					</CardDescription>
				</div>
				<span class="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
					{stats?.byUnor?.length ?? 0} Unit
				</span>
			</CardHeader>

			<CardContent>
				{#if isLoadingStats}
					<div class="py-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
						<Loader2 class="h-5 w-5 animate-spin text-indigo-600 dark:text-indigo-400" />
						<span>Memuat distribusi unit...</span>
					</div>
				{:else if !stats?.byUnor || stats.byUnor.length === 0}
					<div class="py-8 text-center text-xs text-slate-500">
						Tidak ada data usulan untuk filter unit yang dipilih.
					</div>
				{:else}
					<div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
						<table class="w-full text-xs text-left">
							<thead class="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-200 dark:border-slate-800">
								<tr>
									<th class="px-3 py-2.5">Unit Organisasi</th>
									<th class="px-2 py-2.5 text-center">Total</th>
									<th class="px-2 py-2.5 text-center text-amber-600 dark:text-amber-400">Diajukan</th>
									<th class="px-2 py-2.5 text-center text-emerald-600 dark:text-emerald-400">Disetujui</th>
									<th class="px-2 py-2.5 text-center text-rose-600 dark:text-rose-400">Ditolak</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
								{#each stats.byUnor as item}
									<tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
										<td class="px-3 py-2 text-slate-800 dark:text-slate-200">
											<div class="font-medium truncate max-w-[200px] sm:max-w-xs" title={item.namaUnor}>
												{item.namaUnor}
											</div>
											<div class="text-[10px] font-mono text-slate-400 dark:text-slate-500">{item.kodeUnor}</div>
										</td>
										<td class="px-2 py-2 text-center font-bold text-slate-900 dark:text-white">
											{item.total}
										</td>
										<td class="px-2 py-2 text-center text-amber-600 dark:text-amber-400 font-semibold">
											{item.diajukan}
										</td>
										<td class="px-2 py-2 text-center text-emerald-600 dark:text-emerald-400 font-semibold">
											{item.disetujui}
										</td>
										<td class="px-2 py-2 text-center text-rose-600 dark:text-rose-400 font-semibold">
											{item.ditolak}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- Right: Distribusi Kategori Perubahan & Tren -->
		<Card class="lg:col-span-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80">
			<CardHeader class="pb-3">
				<CardTitle class="text-base text-slate-900 dark:text-white flex items-center gap-2">
					<Layers class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
					<span>Kategori Perubahan Data</span>
				</CardTitle>
				<CardDescription class="text-xs text-slate-500 dark:text-slate-400">
					Frekuensi kategori field data kepegawaian yang diusulkan.
				</CardDescription>
			</CardHeader>

			<CardContent class="space-y-4">
				{#if isLoadingStats}
					<div class="py-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
						<Loader2 class="h-5 w-5 animate-spin text-emerald-600 dark:text-emerald-400" />
						<span>Memuat kategori data...</span>
					</div>
				{:else if !stats?.byKategori || stats.byKategori.length === 0}
					<div class="py-8 text-center text-xs text-slate-500">
						Belum ada rincian kategori usulan tercatat.
					</div>
				{:else}
					<div class="space-y-3">
						{#each stats.byKategori as kat}
							{@const percentage = stats.summary.total > 0 ? Math.round((kat.count / stats.summary.total) * 100) : 0}
							<div class="space-y-1">
								<div class="flex items-center justify-between text-xs">
									<span class="font-medium text-slate-700 dark:text-slate-300">{kat.kategori}</span>
									<span class="font-mono text-slate-500 dark:text-slate-400">{kat.count} usulan ({percentage}%)</span>
								</div>
								<div class="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
									<div
										class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-500 dark:to-indigo-400"
										style={`width: ${Math.min(100, Math.max(5, percentage))}%`}
									></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</CardContent>
		</Card>
	</div>

	<!-- Monthly Activity Summary Table -->
	<Card class="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80">
		<CardHeader class="flex flex-row items-center justify-between pb-3">
			<div>
				<CardTitle class="text-base text-slate-900 dark:text-white flex items-center gap-2">
					<Calendar class="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
					<span>Rekapitulasi Aktivitas Bulanan (Tahun {filterTahun !== 'all' ? filterTahun : 'Berjalan'})</span>
				</CardTitle>
				<CardDescription class="text-xs text-slate-500 dark:text-slate-400">
					Rincian tren pengajuan dan penyelesaian usulan per bulan sepanjang tahun kalender.
				</CardDescription>
			</div>
		</CardHeader>

		<CardContent>
			{#if isLoadingStats}
				<div class="py-8 text-center text-xs text-slate-500">Memuat rekap bulanan...</div>
			{:else if !stats?.monthlyTrend || stats.monthlyTrend.length === 0}
				<div class="py-6 text-center text-xs text-slate-500">Data bulanan tidak tersedia.</div>
			{:else}
				<div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
					<table class="w-full text-xs text-left">
						<thead class="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-200 dark:border-slate-800">
							<tr>
								<th class="px-3 py-2.5">Bulan</th>
								<th class="px-2 py-2.5 text-center">Total Usulan</th>
								<th class="px-2 py-2.5 text-center text-amber-600 dark:text-amber-400">Menunggu</th>
								<th class="px-2 py-2.5 text-center text-emerald-600 dark:text-emerald-400">Disetujui</th>
								<th class="px-2 py-2.5 text-center text-rose-600 dark:text-rose-400">Ditolak</th>
								<th class="px-2 py-2.5 text-center">Rasio Sukses</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
							{#each stats.monthlyTrend as item}
								{@const finished = item.disetujui + item.ditolak}
								{@const successRate = finished > 0 ? Math.round((item.disetujui / finished) * 100) : 0}
								<tr class={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${item.total > 0 ? 'bg-indigo-50/20 dark:bg-slate-900/30' : ''}`}>
									<td class="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">
										{item.namaBulan}
									</td>
									<td class="px-2 py-2 text-center font-bold text-slate-900 dark:text-white">
										{item.total}
									</td>
									<td class="px-2 py-2 text-center text-amber-600 dark:text-amber-400">
										{item.diajukan}
									</td>
									<td class="px-2 py-2 text-center text-emerald-600 dark:text-emerald-400">
										{item.disetujui}
									</td>
									<td class="px-2 py-2 text-center text-rose-600 dark:text-rose-400">
										{item.ditolak}
									</td>
									<td class="px-2 py-2 text-center font-mono text-[11px]">
										{#if finished > 0}
											<span class={successRate >= 70 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-600 dark:text-slate-400'}>
												{successRate}%
											</span>
										{:else}
											<span class="text-slate-400 dark:text-slate-600">-</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Scoping & Access Verification Section (Khusus Admin Pusat untuk verifikasi diagnostik) -->
	{#if authState.isAdmin}
		<Card class="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
			<CardHeader class="flex flex-row items-center justify-between">
				<div>
					<CardTitle class="text-base text-slate-900 dark:text-white flex items-center gap-2">
						<Shield class="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
						<span>Status Scoping Hak Akses (resolveUnorScope)</span>
					</CardTitle>
					<CardDescription class="text-xs text-slate-500 dark:text-slate-400">
						Evaluasi server backend atas token otentikasi aktif pada endpoint terproteksi <code>/api/scoped-data</code>.
					</CardDescription>
				</div>
				<Button
					variant="outline"
					size="sm"
					class="h-8 gap-1.5 text-xs border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
					onclick={loadScope}
					disabled={isLoadingScope}
				>
					<RefreshCw class={`h-3.5 w-3.5 ${isLoadingScope ? 'animate-spin' : ''}`} />
					<span>Verifikasi</span>
				</Button>
			</CardHeader>

			<CardContent>
				{#if isLoadingScope}
					<div class="py-4 text-center text-xs text-slate-500">Memeriksa hak akses...</div>
				{:else if scopedInfo}
					<div class="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/60 p-4 space-y-3">
						<div class="flex items-center justify-between flex-wrap gap-2">
							<div class="flex items-center gap-2">
								{#if scopedInfo.success}
									<CheckCircle2 class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
									<span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Scoping Sukses & Aman</span>
								{:else}
									<AlertCircle class="h-4 w-4 text-rose-600 dark:text-rose-400" />
									<span class="text-xs font-semibold text-rose-600 dark:text-rose-400">Scoping Gagal</span>
								{/if}
							</div>
							<Badge variant={scopedInfo.isRestricted ? 'secondary' : 'default'} class="text-xs">
								{scopedInfo.isRestricted ? 'Akses Terisolasi OPD' : 'Akses Penuh Pusat'}
							</Badge>
						</div>

						<p class="text-xs text-slate-600 dark:text-slate-300">
							{scopedInfo.message || 'Evaluasi hak akses berhasil.'}
						</p>

						<div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-200 dark:border-slate-800/60">
							<div>
								<span class="text-slate-500 block text-[11px]">Role Pengguna:</span>
								<span class="font-mono text-slate-800 dark:text-slate-200">{scopedInfo.userRole || '-'}</span>
							</div>
							<div>
								<span class="text-slate-500 block text-[11px]">Unit Kerja (UNOR):</span>
								<span class="font-medium text-slate-800 dark:text-slate-200 block truncate" title={unorName()}>{unorName()}</span>
							</div>
							<div>
								<span class="text-slate-500 block text-[11px]">Scope Aktif:</span>
								<span class="font-mono text-slate-800 dark:text-slate-200">{scopedInfo.scopeUnor || '(Global / Semua)'}</span>
							</div>
						</div>
					</div>
				{/if}
			</CardContent>
		</Card>
	{/if}
</div>
