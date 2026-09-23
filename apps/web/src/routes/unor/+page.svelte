<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authState } from '$lib/stores/auth.svelte';
	import { fetchUnorList, type UnorItem } from '$lib/api/pegawai';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Building2, ArrowRight, Loader2, AlertCircle, RefreshCw } from 'lucide-svelte';

	let unors = $state<UnorItem[]>([]);
	let isLoading = $state(true);
	let errorMessage = $state('');

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
	<title>Master Unit Organisasi (UNOR) - Usul Data</title>
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

		<div>
			<Button
				variant="outline"
				size="sm"
				class="gap-1.5 text-xs h-9"
				onclick={loadUnor}
				disabled={isLoading}
			>
				<RefreshCw class={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
				<span>Segarkan</span>
			</Button>
		</div>
	</div>

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
								Unit Organisasi
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
