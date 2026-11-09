<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { authState } from "$lib/stores/auth.svelte";
	import { fetchUnorList, type UnorItem } from "$lib/api/pegawai";
	import { syncSimpegUnor, type SimpegSyncResult } from "$lib/api/simpeg";
	import { Badge } from "$lib/components/ui/badge";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Dialog } from "$lib/components/ui/dialog";
	import {
		Alert,
		AlertTitle,
		AlertDescription,
	} from "$lib/components/ui/alert";
	import {
		Building2,
		ArrowRight,
		ArrowUpRight,
		Loader2,
		AlertCircle,
		CheckCircle2,
		RefreshCw,
		CloudDownload,
		AlertTriangle,
		Search,
		X,
		Users,
	} from "lucide-svelte";

	let unors = $state<UnorItem[]>([]);
	let isLoading = $state(true);
	let errorMessage = $state("");
	let searchQuery = $state("");

	let filteredUnors = $derived(
		unors.filter((u) => {
			const query = searchQuery.trim().toLowerCase();
			if (!query) return true;
			return (
				u.namaUnor.toLowerCase().includes(query) ||
				u.kodeUnor.toLowerCase().includes(query)
			);
		}),
	);

	// State Sinkronisasi SIMPEG
	let isSyncing = $state(false);
	let syncResult = $state<SimpegSyncResult | null>(null);
	let isResultOpen = $state(false);
	let alertMessage = $state<{
		type: "success" | "destructive";
		title: string;
		desc: string;
	} | null>(null);

	async function loadUnor() {
		isLoading = true;
		errorMessage = "";
		const res = await fetchUnorList();
		isLoading = false;
		if (res.success && Array.isArray(res.data)) {
			unors = res.data;
		} else {
			errorMessage = res.message || "Gagal memuat daftar unit organisasi";
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
				type: "destructive",
				title: "Sinkronisasi Gagal",
				desc:
					res.message ||
					"Terjadi kesalahan saat menarik data UNOR dari SIMPEG.",
			};
		}
	}

	onMount(() => {
		if (authState.isInitialized && !authState.isAdmin) {
			goto("/pegawai");
			return;
		}
		loadUnor();
	});

	$effect(() => {
		if (authState.isInitialized && !authState.isAdmin) {
			goto("/pegawai");
		}
	});
</script>

<svelte:head>
	<title>Master Unit Organisasi (UNOR) - ASN-Sync</title>
</svelte:head>

<div class="max-w-7xl mx-auto space-y-6">
	<!-- Page Header -->
	<div
		class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
	>
		<div>
			<div class="flex items-center gap-2 mb-1">
				<Badge variant="default" class="text-xs">
					Akses Penuh Admin Pusat
				</Badge>
			</div>
			<h1
				class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5"
			>
				<Building2
					class="h-7 w-7 text-emerald-600 dark:text-emerald-400"
				/>
				<span>Daftar Unit Organisasi (UNOR)</span>
			</h1>
			<p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
				Master referensi satuan kerja dan organisasi perangkat daerah di
				lingkungan pemerintahan.
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
				<RefreshCw
					class={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
				/>
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
			{#if alertMessage.type === "success"}
				<CheckCircle2
					class="h-4 w-4 text-emerald-500 dark:text-emerald-400"
				/>
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

	<!-- Search & Filter Bar -->
	<div
		class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs"
	>
		<div class="relative flex-1 max-w-md">
			<Search
				class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
			/>
			<Input
				bind:value={searchQuery}
				placeholder="Cari nama atau kode unit kerja..."
				class="pl-9 pr-8 h-9 text-xs"
			/>
			{#if searchQuery}
				<button
					type="button"
					class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
					onclick={() => (searchQuery = "")}
					title="Hapus pencarian"
				>
					<X class="h-3.5 w-3.5" />
				</button>
			{/if}
		</div>
		<div
			class="text-xs text-slate-500 dark:text-slate-400 font-medium px-1"
		>
			Menampilkan <span class="font-bold text-slate-900 dark:text-white"
				>{filteredUnors.length}</span
			>
			dari {unors.length} unit kerja
		</div>
	</div>

	{#if isLoading}
		<div
			class="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2"
		>
			<Loader2 class="h-6 w-6 text-emerald-400 animate-spin" />
			<span class="text-xs">Memuat data UNOR...</span>
		</div>
	{:else if errorMessage}
		<div
			class="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs"
		>
			{errorMessage}
		</div>
	{:else if filteredUnors.length === 0}
		<div
			class="py-14 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 bg-slate-50/50 dark:bg-slate-900/20"
		>
			<Building2 class="h-8 w-8 text-slate-400 mx-auto mb-2 opacity-50" />
			<p class="text-sm font-semibold text-slate-700 dark:text-slate-300">
				Tidak ada unit organisasi ditemukan
			</p>
			<p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
				Coba kata kunci pencarian lain atau bersihkan kotak pencarian.
			</p>
			{#if searchQuery}
				<Button
					variant="outline"
					size="sm"
					class="mt-3 text-xs"
					onclick={() => (searchQuery = "")}
				>
					Bersihkan Pencarian
				</Button>
			{/if}
		</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
			{#each filteredUnors as u}
				<a
					href="/pegawai?kode_unor={encodeURIComponent(u.kodeUnor)}"
					class="group relative flex flex-col justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-emerald-500 dark:hover:border-emerald-500/80 hover:shadow-md transition-all duration-150 cursor-pointer"
				>
					<div class="space-y-2">
						<div class="flex items-center justify-between gap-2">
							<span
								class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
							>
								{u.kodeUnor}
							</span>
							<div
								class="text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
							>
								<ArrowUpRight class="h-4 w-4" />
							</div>
						</div>
						<h3
							class="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors line-clamp-2 leading-snug"
						>
							{u.namaUnor}
						</h3>
					</div>

					<div
						class="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500"
					>
						<span
							class="flex items-center gap-1 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"
						>
							<Users class="h-3 w-3" />
							<span>Lihat Pegawai</span>
						</span>
					</div>
				</a>
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
				<div
					class="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
				>
					<p class="text-xs text-slate-500 dark:text-slate-400">
						Total Ditarik
					</p>
					<p
						class="text-xl font-bold text-slate-900 dark:text-white mt-0.5"
					>
						{syncResult.totalFetched}
					</p>
				</div>
				<div
					class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60"
				>
					<p class="text-xs text-emerald-600 dark:text-emerald-400">
						Berhasil Disinkron
					</p>
					<p
						class="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5"
					>
						{syncResult.totalUpserted}
					</p>
				</div>
			</div>

			{#if syncResult.errors && syncResult.errors.length > 0}
				<div class="space-y-2">
					<div
						class="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400"
					>
						<AlertTriangle class="h-4 w-4" />
						<span
							>Peringatan / Data Dilewati ({syncResult.errors
								.length})</span
						>
					</div>
					<div
						class="max-h-40 overflow-y-auto space-y-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
					>
						{#each syncResult.errors as err}
							<div
								class="text-[11px] text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-900 pb-1 last:border-none"
							>
								<span
									class="font-mono font-medium text-slate-800 dark:text-slate-200"
									>[{err.identifier}]:</span
								>
								<span>{err.message}</span>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div
					class="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300"
				>
					<CheckCircle2 class="h-4 w-4 shrink-0" />
					<span
						>Seluruh data Unit Organisasi berhasil diperbarui dan
						diselaraskan tanpa kendala.</span
					>
				</div>
			{/if}
		{/if}

		<div
			class="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800"
		>
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
