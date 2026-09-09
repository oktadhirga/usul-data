<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchUnorList, getActiveUser } from '$lib/api';
	import type { Unor, UserProfile } from '$lib/types/kepegawaian';

	let activeUser = $state<UserProfile>(getActiveUser());
	let unors = $state<Unor[]>([]);
	let isLoading = $state<boolean>(true);
	let errorMessage = $state<string>('');

	async function loadUnor() {
		isLoading = true;
		errorMessage = '';
		activeUser = getActiveUser();
		try {
			unors = await fetchUnorList();
		} catch (err: any) {
			errorMessage = err.message || 'Gagal memuat daftar unit organisasi';
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		loadUnor();

		const handleUserChange = () => {
			activeUser = getActiveUser();
			loadUnor();
		};

		window.addEventListener('user-changed', handleUserChange);
		return () => {
			window.removeEventListener('user-changed', handleUserChange);
		};
	});
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
	<!-- Page Header -->
	<div class="border-b border-slate-800/80 pb-6">
		<div class="flex items-center gap-2 mb-1">
			<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950/80 text-indigo-400 border border-indigo-800/60">
				Master Data
			</span>
			{#if activeUser.role === 'AdminOPD'}
				<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/60">
					Akses Dibatasi: {activeUser.kodeUnor}
				</span>
			{:else}
				<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
					Akses Penuh Admin Pusat
				</span>
			{/if}
		</div>
		<h1 class="text-3xl font-extrabold text-white tracking-tight">Daftar Unit Organisasi (UNOR)</h1>
		<p class="text-slate-400 text-sm mt-1">
			Master referensi satuan kerja dan organisasi perangkat daerah di lingkungan pemerintahan.
		</p>
	</div>

	{#if isLoading}
		<div class="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
			<div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
			<span class="text-sm">Memuat data UNOR...</span>
		</div>
	{:else if errorMessage}
		<div class="p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-sm">
			{errorMessage}
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
			{#each unors as u}
				<div class="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition shadow-sm space-y-3">
					<div class="flex items-center justify-between">
						<span class="px-2.5 py-1 rounded-md bg-slate-800 text-indigo-300 font-mono text-xs font-semibold border border-slate-700">
							{u.kodeUnor}
						</span>
						<span class="text-[11px] text-slate-500 font-mono">ID: {u.id}</span>
					</div>
					<h3 class="font-bold text-white text-base">
						{u.namaUnor}
					</h3>
					<div class="pt-2 border-t border-slate-800/80 flex items-center justify-between">
						<a
							href="/pegawai"
							class="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
						>
							Lihat Pegawai di UNOR ini →
						</a>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
