<script lang="ts">
	import { onMount } from 'svelte';
	import { authState } from '$lib/stores/auth.svelte';
	import { fetchScopedData, type ScopedDataResponse } from '$lib/api/users';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import {
		Shield,
		Building2,
		Users,
		KeyRound,
		CheckCircle2,
		AlertCircle,
		RefreshCw,
		Layers,
		ArrowRight
	} from 'lucide-svelte';

	let scopedInfo = $state<ScopedDataResponse | null>(null);
	let isLoadingScope = $state(false);

	async function loadScope() {
		isLoadingScope = true;
		scopedInfo = await fetchScopedData();
		isLoadingScope = false;
	}

	onMount(() => {
		if (authState.isAuthenticated) {
			loadScope();
		}
	});

	$effect(() => {
		if (authState.isAuthenticated && !scopedInfo && !isLoadingScope) {
			loadScope();
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
				Selamat datang di portal Usul Data. Hak akses Anda terkonfigurasi sebagai
				<span class="font-semibold text-slate-200">{authState.isAdmin ? 'Administrator Pusat' : 'Administrator OPD'}</span>.
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
					{authState.isAdmin ? 'Akses penuh ke semua modul dan manajemen user' : 'Dibatasi pada lingkup unit kerja Anda'}
				</p>
			</CardContent>
		</Card>

		<!-- UNOR Scope Card -->
		<Card class="border-slate-800 bg-slate-900/70">
			<CardHeader class="flex flex-row items-center justify-between pb-2">
				<CardTitle class="text-sm font-medium text-slate-400">Kode Unit Organisasi</CardTitle>
				<Building2 class="h-4 w-4 text-emerald-400" />
			</CardHeader>
			<CardContent class="space-y-1">
				<div class="text-2xl font-bold text-white truncate">
					{authState.user?.kodeUnor || (authState.isAdmin ? 'Semua Unit (Pusat)' : 'Belum Ditugaskan')}
				</div>
				<p class="text-xs text-slate-500">
					{authState.user?.kodeUnor ? 'Scope data aktif untuk OPD terkait' : 'Tidak ada pembatasan unit organisasi'}
				</p>
			</CardContent>
		</Card>

		<!-- Quick Actions Card -->
		<Card class="border-slate-800 bg-slate-900/70">
			<CardHeader class="flex flex-row items-center justify-between pb-2">
				<CardTitle class="text-sm font-medium text-slate-400">Aksi Cepat</CardTitle>
				<Layers class="h-4 w-4 text-amber-400" />
			</CardHeader>
			<CardContent class="space-y-2 pt-1">
				{#if authState.isAdmin}
					<a href="/users" class="block">
						<Button variant="secondary" size="sm" class="w-full justify-between text-xs h-8">
							<span class="flex items-center gap-1.5">
								<Users class="h-3.5 w-3.5 text-indigo-400" />
								<span>Kelola Pengguna</span>
							</span>
							<ArrowRight class="h-3 w-3" />
						</Button>
					</a>
				{/if}
				<a href="/profile" class="block">
					<Button variant="outline" size="sm" class="w-full justify-between text-xs h-8">
						<span class="flex items-center gap-1.5">
							<KeyRound class="h-3.5 w-3.5 text-emerald-400" />
							<span>Ganti Password</span>
						</span>
						<ArrowRight class="h-3 w-3" />
					</Button>
				</a>
			</CardContent>
		</Card>
	</div>

	<!-- Scoped Data Live Test Widget -->
	<Card class="border-slate-800 bg-slate-900/60 shadow-sm">
		<CardHeader class="flex flex-row items-center justify-between">
			<div class="space-y-1">
				<CardTitle class="text-lg font-semibold text-white">
					Verifikasi Middleware Scoping (Live)
				</CardTitle>
				<CardDescription class="text-xs text-slate-400">
					Menguji endpoint API <code>/api/scoped-data</code> untuk memastikan aturan filter OPD berjalan sesuai hak akses.
				</CardDescription>
			</div>
			<Button
				variant="outline"
				size="sm"
				class="h-8 gap-1.5 text-xs text-slate-300"
				onclick={loadScope}
				disabled={isLoadingScope}
			>
				<RefreshCw class={`h-3.5 w-3.5 ${isLoadingScope ? 'animate-spin text-indigo-400' : ''}`} />
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
							<span class="text-slate-500 block">Kode UNOR Pengguna:</span>
							<span class="font-mono text-slate-300">{scopedInfo.userKodeUnor || '(None)'}</span>
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
