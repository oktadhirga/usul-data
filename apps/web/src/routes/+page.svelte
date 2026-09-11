<script lang="ts">
	import { onMount } from 'svelte';
	import { authState } from '$lib/stores/auth.svelte';
	import { fetchScopedData, type ScopedDataResponse } from '$lib/api/users';
	import { fetchUnorList, type UnorItem } from '$lib/api/pegawai';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import {
		Shield,
		Building2,
		Users,
		Briefcase,
		KeyRound,
		CheckCircle2,
		AlertCircle,
		RefreshCw,
		ArrowRight
	} from 'lucide-svelte';

	let scopedInfo = $state<ScopedDataResponse | null>(null);
	let isLoadingScope = $state(false);
	let unorList = $state<UnorItem[]>([]);

	const unorName = $derived(() => {
		if (authState.isAdmin) return 'Semua Unit (Pusat)';
		if (!authState.user?.kodeUnor) return 'Belum Ditugaskan';
		const found = unorList.find((u) => u.kodeUnor === authState.user?.kodeUnor);
		return found ? found.namaUnor : authState.user.kodeUnor;
	});

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
		}
	});

	$effect(() => {
		if (authState.isAuthenticated && !scopedInfo && !isLoadingScope) {
			loadScope();
			loadUnors();
		}
	});
</script>

<svelte:head>
	<title>Dashboard - Usul Data</title>
</svelte:head>

<div class="space-y-6 max-w-6xl mx-auto">
	<!-- Welcome Banner -->
	<div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/50 via-slate-900 to-slate-900 border border-indigo-500/20 p-6 md:p-8 shadow-lg">
		<div class="relative z-10 space-y-2">
			<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
				<Shield class="h-3.5 w-3.5" />
				<span>Role-Based Access Control Aktif</span>
			</div>
			<h2 class="text-2xl md:text-3xl font-bold text-white tracking-tight">
				Halo, {authState.user?.username || 'Pengguna'}!
			</h2>
			<p class="text-slate-400 text-sm max-w-2xl">
				Selamat datang di portal Usul Data Kepegawaian. Hak akses Anda terkonfigurasi sebagai
				<span class="font-semibold text-slate-200">{authState.isAdmin ? 'Administrator Pusat' : 'Administrator OPD'}</span>
				{#if !authState.isAdmin && authState.user?.kodeUnor}
					pada <span class="font-semibold text-emerald-400">{unorName()}</span>
				{/if}.
			</p>
		</div>
	</div>

	<!-- Overview Stats Grid -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-5">
		<!-- Role Info Card -->
		<Card class="border-slate-800 bg-slate-900/70">
			<CardHeader class="flex flex-row items-center justify-between pb-2">
				<CardTitle class="text-sm font-medium text-slate-400">Tipe Peran Akun</CardTitle>
				<Shield class="h-4 w-4 text-indigo-400" />
			</CardHeader>
			<CardContent class="space-y-1">
				<div class="text-2xl font-bold text-white">
					{authState.user?.role || '-'}
				</div>
				<p class="text-xs text-slate-500">
					{authState.isAdmin ? 'Akses penuh ke semua unit organisasi & modul' : 'Dibatasi pada lingkup unit kerja Anda'}
				</p>
			</CardContent>
		</Card>

		<!-- UNOR Scope Card -->
		<Card class="border-slate-800 bg-slate-900/70">
			<CardHeader class="flex flex-row items-center justify-between pb-2">
				<CardTitle class="text-sm font-medium text-slate-400">Unit Organisasi</CardTitle>
				<Building2 class="h-4 w-4 text-emerald-400" />
			</CardHeader>
			<CardContent class="space-y-1">
				<div class="text-lg sm:text-xl font-bold text-white truncate" title={unorName()}>
					{unorName()}
				</div>
				<p class="text-xs text-slate-500">
					{#if authState.user?.kodeUnor}
						Scope data OPD aktif
					{:else}
						{authState.isAdmin ? 'Akses lintas seluruh unit organisasi' : 'Tidak ada pembatasan unit organisasi'}
					{/if}
				</p>
			</CardContent>
		</Card>

		<!-- Quick Actions Card -->
		<Card class="border-slate-800 bg-slate-900/70">
			<CardHeader class="flex flex-row items-center justify-between pb-2">
				<CardTitle class="text-sm font-medium text-slate-400">Pintasan Cepat</CardTitle>
				<Briefcase class="h-4 w-4 text-indigo-400" />
			</CardHeader>
			<CardContent class="space-y-2">
				<a
					href="/pegawai"
					class="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-200 transition"
				>
					<span>Kelola Data Pegawai</span>
					<ArrowRight class="h-3.5 w-3.5 text-indigo-400" />
				</a>
				{#if authState.isAdmin}
					<a
						href="/unor"
						class="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-200 transition"
					>
						<span>Daftar Master UNOR</span>
						<ArrowRight class="h-3.5 w-3.5 text-emerald-400" />
					</a>
				{/if}
			</CardContent>
		</Card>
	</div>

	<!-- Module Quick Cards -->
	<div class={`grid gap-5 ${authState.isAdmin ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
		<Card class="border-slate-800 bg-slate-900/50 hover:border-slate-700 transition">
			<CardHeader>
				<div class="flex items-center justify-between">
					<CardTitle class="text-lg text-white flex items-center gap-2">
						<Briefcase class="h-5 w-5 text-indigo-400" />
						<span>Modul Data Pegawai</span>
					</CardTitle>
					<Badge variant="default" class="text-xs">Aktif</Badge>
				</div>
				<CardDescription>
					Pengelolaan data aparatur sipil per Unit Organisasi (UNOR) dengan filter otorisasi peran berjenjang dan halaman profil pegawai.
				</CardDescription>
			</CardHeader>
			<CardContent class="pt-0">
				<Button href="/pegawai" class="w-full sm:w-auto text-xs" size="sm">
					Buka Daftar Pegawai <ArrowRight class="ml-1.5 h-3.5 w-3.5" />
				</Button>
			</CardContent>
		</Card>

		{#if authState.isAdmin}
			<Card class="border-slate-800 bg-slate-900/50 hover:border-slate-700 transition">
				<CardHeader>
					<div class="flex items-center justify-between">
						<CardTitle class="text-lg text-white flex items-center gap-2">
							<Building2 class="h-5 w-5 text-emerald-400" />
							<span>Master Unit Organisasi (UNOR)</span>
						</CardTitle>
						<Badge variant="secondary" class="text-xs">Referensi</Badge>
					</div>
					<CardDescription>
						Daftar unit organisasi induk dan satuan kerja perangkat daerah (OPD) sebagai referensi penempatan aparatur.
					</CardDescription>
				</CardHeader>
				<CardContent class="pt-0">
					<Button href="/unor" variant="outline" class="w-full sm:w-auto text-xs" size="sm">
						Lihat Master UNOR <ArrowRight class="ml-1.5 h-3.5 w-3.5" />
					</Button>
				</CardContent>
			</Card>
		{/if}
	</div>

	<!-- Scoping Verification Section -->
	<Card class="border-slate-800 bg-slate-900/60">
		<CardHeader class="flex flex-row items-center justify-between">
			<div>
				<CardTitle class="text-base text-white flex items-center gap-2">
					<Shield class="h-4 w-4 text-indigo-400" />
					<span>Verifikasi Scoping Hak Akses (resolveUnorScope)</span>
				</CardTitle>
				<CardDescription class="text-xs">
					Status evaluasi backend atas token otentikasi Anda pada endpoint terproteksi <code>/api/scoped-data</code>.
				</CardDescription>
			</div>
			<Button
				variant="outline"
				size="sm"
				class="h-8 gap-1.5 text-xs"
				onclick={loadScope}
				disabled={isLoadingScope}
			>
				<RefreshCw class={`h-3.5 w-3.5 ${isLoadingScope ? 'animate-spin' : ''}`} />
				<span>Perbarui</span>
			</Button>
		</CardHeader>

		<CardContent>
			{#if isLoadingScope}
				<div class="py-6 text-center text-xs text-slate-500">Memuat status scoping...</div>
			{:else if scopedInfo}
				<div class="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 space-y-3">
					<div class="flex items-center justify-between flex-wrap gap-2">
						<div class="flex items-center gap-2">
							{#if scopedInfo.success}
								<CheckCircle2 class="h-4 w-4 text-emerald-400" />
								<span class="text-xs font-semibold text-emerald-400">Scoping Sukses</span>
							{:else}
								<AlertCircle class="h-4 w-4 text-rose-400" />
								<span class="text-xs font-semibold text-rose-400">Scoping Gagal</span>
							{/if}
						</div>
						<div class="flex items-center gap-2">
							<Badge variant={scopedInfo.isRestricted ? 'secondary' : 'default'} class="text-xs">
								{scopedInfo.isRestricted ? 'Data Terfilter (OPD)' : 'Akses Global (Pusat)'}
							</Badge>
						</div>
					</div>

					<p class="text-sm text-slate-300 font-medium">
						{scopedInfo.message || 'Pengecekan scope berhasil.'}
					</p>

					<div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-800/60">
						<div>
							<span class="text-slate-500 block">Role Terverifikasi:</span>
							<span class="font-mono text-slate-300">{scopedInfo.userRole || '-'}</span>
						</div>
						<div>
							<span class="text-slate-500 block">Unit Organisasi:</span>
							<span class="font-medium text-slate-300 block truncate" title={unorName()}>{unorName()}</span>
							{#if scopedInfo.userKodeUnor}
								<span class="font-mono text-[11px] text-emerald-400/80 font-medium">({scopedInfo.userKodeUnor})</span>
							{/if}
						</div>
						<div>
							<span class="text-slate-500 block">Scope UNOR Aktif:</span>
							<span class="font-mono text-slate-300">{scopedInfo.scopeUnor || '(Global)'}</span>
						</div>
					</div>
				</div>
			{:else}
				<div class="py-4 text-center text-xs text-slate-500">
					Klik tombol "Perbarui" untuk memeriksa status scoping.
				</div>
			{/if}
		</CardContent>
	</Card>
</div>
