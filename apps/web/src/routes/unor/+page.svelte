<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authState } from '$lib/stores/auth.svelte';
	import { fetchUnorList, type UnorItem } from '$lib/api/pegawai';
	import { syncSimpegUnor, type SimpegSyncResult } from '$lib/api/simpeg';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Dialog } from '$lib/components/ui/dialog';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert';
	import {
		Building2,
		ArrowRight,
		Loader2,
		AlertCircle,
		CheckCircle2,
		RefreshCw,
		CloudDownload,
		AlertTriangle
	} from 'lucide-svelte';

	let unors = $state<UnorItem[]>([]);
	let isLoading = $state(true);
	let errorMessage = $state('');

	// State Sinkronisasi SIMPEG
	let isSyncing = $state(false);
	let syncResult = $state<SimpegSyncResult | null>(null);
	let isResultOpen = $state(false);
	let alertMessage = $state<{ type: 'success' | 'destructive'; title: string; desc: string } | null>(null);

	async function loadUnor() {
		isLoading = true;
		errorMessage = '';
		const res = await fetchUnorList();
		isLoading = false;
		if (res.success && Array.isArray(res.data)) {
			unors = res.data;
		} else {
			errorMessage = res.message || 'Gagal memuat daftar unit organisasi';
		}
	}

	async function handleSyncSimpeg() {
		isSyncing = true;
		alertMessage = null;

		const res = await syncSimpegUnor();
		isSyncing = false;

		if (res.success && res.data) {
			syncResult = res.data;
			isResultOpen = true;
			await loadUnor();
		} else {
			alertMessage = {
				type: 'destructive',
				title: 'Sinkronisasi Gagal',
				desc: res.message || 'Terjadi kesalahan saat menarik data UNOR dari SIMPEG.'
			};
		}
	}

	onMount(() => {
		if (authState.isInitialized && !authState.isAdmin) {
			goto('/pegawai');
			return;
		}
		loadUnor();
	});

	$effect(() => {
		if (authState.isInitialized && !authState.isAdmin) {
			goto('/pegawai');
		}
	});
</script>

<svelte:head>
	<title>Master Unit Organisasi (UNOR) - ASN-Sync</title>
</svelte:head>

<div class="max-w-7xl mx-auto space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<div class="flex items-center gap-2 mb-1">
				<Badge variant="default" class="text-xs">
					Akses Penuh Admin Pusat
				</Badge>
			</div>
			<h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
				<Building2 class="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
				<span>Daftar Unit Organisasi (UNOR)</span>
			</h1>
			<p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
				Master referensi satuan kerja dan organisasi perangkat daerah di lingkungan pemerintahan.
			</p>
		</div>

		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				class="gap-1.5 text-xs h-9"
				onclick={loadUnor}
				disabled={isLoading || isSyncing}
			>
				<RefreshCw class={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
				<span>Segarkan</span>
			</Button>

			{#if authState.isAdmin}
				<Button
					size="sm"
					class="gap-1.5 text-xs h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm cursor-pointer disabled:opacity-50"
					onclick={handleSyncSimpeg}
					disabled={isSyncing || isLoading}
				>
					{#if isSyncing}
						<Loader2 class="h-3.5 w-3.5 animate-spin" />
						<span>Menarik dari SIMPEG...</span>
					{:else}
						<CloudDownload class="h-4 w-4" />
						<span>Tarik Data UNOR (SIMPEG)</span>
					{/if}
				</Button>
			{/if}
		</div>
	</div>

	<!-- Alert Messages -->
	{#if alertMessage}
		<Alert variant={alertMessage.type} class="relative">
			{#if alertMessage.type === 'success'}
				<CheckCircle2 class="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
			{:else}
				<AlertCircle class="h-4 w-4 text-rose-500 dark:text-rose-400" />
			{/if}
			<AlertTitle>{alertMessage.title}</AlertTitle>
			<AlertDescription>{alertMessage.desc}</AlertDescription>
			<button
				type="button"
				class="absolute top-3 right-3 text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs cursor-pointer"
				onclick={() => (alertMessage = null)}
			>
				✕
			</button>
		</Alert>
	{/if}

	{#if isLoading}
		<div class="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
			<Loader2 class="h-6 w-6 text-emerald-400 animate-spin" />
			<span class="text-xs">Memuat data UNOR...</span>
		</div>
	{:else if errorMessage}
		<div class="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
			{errorMessage}
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
			{#each unors as u}
				<Card class="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 transition">
					<CardHeader class="pb-3">
						<div class="flex items-center justify-between mb-1">
							<Badge variant="outline" class="font-normal text-xs bg-indigo-50 dark:bg-slate-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-slate-700">
								{u.kodeUnor}
							</Badge>
							<span class="text-[11px] text-slate-400 dark:text-slate-500 font-mono">ID: {u.id}</span>
						</div>
						<CardTitle class="text-base font-bold text-slate-900 dark:text-white">
							{u.namaUnor}
						</CardTitle>
					</CardHeader>
					<CardContent class="pt-0">
						<div class="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
							<a
								href="/pegawai?kode_unor={encodeURIComponent(u.kodeUnor)}"
								class="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium inline-flex items-center gap-1"
							>
								<span>Lihat Pegawai di UNOR ini</span>
								<ArrowRight class="h-3 w-3" />
							</a>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>

<!-- Modal Hasil Sinkronisasi UNOR -->
<Dialog
	bind:open={isResultOpen}
	title="Hasil Sinkronisasi UNOR dari SIMPEG"
	description="Laporan rekapitulasi data Unit Organisasi yang ditarik dari SIMPEG BKD."
	onclose={() => (isResultOpen = false)}
>
	<div class="space-y-4">
		{#if syncResult}
			<div class="grid grid-cols-2 gap-3 text-center">
				<div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
					<p class="text-xs text-slate-500 dark:text-slate-400">Total Ditarik</p>
					<p class="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{syncResult.totalFetched}</p>
				</div>
				<div class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
					<p class="text-xs text-emerald-600 dark:text-emerald-400">Berhasil Disinkron</p>
					<p class="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{syncResult.totalUpserted}</p>
				</div>
			</div>

			{#if syncResult.errors && syncResult.errors.length > 0}
				<div class="space-y-2">
					<div class="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
						<AlertTriangle class="h-4 w-4" />
						<span>Peringatan / Data Dilewati ({syncResult.errors.length})</span>
					</div>
					<div class="max-h-40 overflow-y-auto space-y-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
						{#each syncResult.errors as err}
							<div class="text-[11px] text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-900 pb-1 last:border-none">
								<span class="font-mono font-medium text-slate-800 dark:text-slate-200">[{err.identifier}]:</span>
								<span>{err.message}</span>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
					<CheckCircle2 class="h-4 w-4 shrink-0" />
					<span>Seluruh data Unit Organisasi berhasil diperbarui dan diselaraskan tanpa kendala.</span>
				</div>
			{/if}
		{/if}

		<div class="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
			<Button
				variant="default"
				size="sm"
				class="text-xs"
				onclick={() => (isResultOpen = false)}
			>
				Tutup
			</Button>
		</div>
	</div>
</Dialog>
