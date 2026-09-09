<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { fetchPegawaiById, deletePegawai, getActiveUser } from '$lib/api';
	import type { Pegawai, UserProfile } from '$lib/types/kepegawaian';

	const employeeId = Number(page.params.id);

	let activeUser = $state<UserProfile>(getActiveUser());
	let pegawai = $state<Pegawai | null>(null);
	let isLoading = $state<boolean>(true);
	let errorMessage = $state<string>('');
	let isForbidden = $state<boolean>(false);
	let showDeleteConfirm = $state<boolean>(false);

	async function loadDetail() {
		isLoading = true;
		errorMessage = '';
		isForbidden = false;
		activeUser = getActiveUser();

		try {
			const data = await fetchPegawaiById(employeeId);
			if (!data) {
				errorMessage = 'Data pegawai dengan ID ini tidak ditemukan.';
			} else {
				pegawai = data;
			}
		} catch (err: any) {
			if (err.message?.includes('Forbidden')) {
				isForbidden = true;
				errorMessage = 'Akses Ditolak: Anda tidak memiliki hak akses untuk melihat data pegawai dari Unit Organisasi lain.';
			} else {
				errorMessage = err.message || 'Gagal memuat data detail pegawai.';
			}
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		loadDetail();

		const handleUserChange = () => {
			activeUser = getActiveUser();
			loadDetail();
		};

		window.addEventListener('user-changed', handleUserChange);
		return () => {
			window.removeEventListener('user-changed', handleUserChange);
		};
	});

	async function handleDelete() {
		if (!pegawai) return;
		try {
			const res = await deletePegawai(pegawai.id);
			if (res.success) {
				window.location.href = '/pegawai';
			} else {
				errorMessage = res.message || 'Gagal menghapus pegawai';
			}
		} catch (err: any) {
			errorMessage = err.message || 'Terjadi kesalahan saat menghapus pegawai';
		}
	}
</script>

<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
	<!-- Breadcrumbs & Navigation -->
	<div class="flex items-center justify-between">
		<nav class="flex items-center gap-2 text-xs text-slate-400">
			<a href="/" class="hover:text-white transition">Beranda</a>
			<span>/</span>
			<a href="/pegawai" class="hover:text-white transition">Data Pegawai</a>
			<span>/</span>
			<span class="text-slate-200 font-medium">Detail Pegawai</span>
		</nav>

		<a
			href="/pegawai"
			class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
		>
			<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
			</svg>
			Kembali ke Daftar
		</a>
	</div>

	{#if isLoading}
		<div class="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
			<div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
			<span class="text-sm">Memuat detail pegawai...</span>
		</div>
	{:else if isForbidden}
		<div class="p-8 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-center space-y-4 shadow-xl">
			<div class="w-14 h-14 rounded-full bg-rose-950 flex items-center justify-center text-rose-400 mx-auto border border-rose-800">
				<svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
				</svg>
			</div>
			<div class="max-w-md mx-auto space-y-2">
				<h2 class="text-xl font-bold text-white">403 - Akses Ditolak</h2>
				<p class="text-sm text-rose-300">
					{errorMessage}
				</p>
				<p class="text-xs text-slate-400">
					Akun Anda ({activeUser.username}) memiliki pembatasan Unit Organisasi ke <span class="font-mono text-slate-200">{activeUser.kodeUnor}</span>.
				</p>
			</div>
			<div class="pt-2">
				<a
					href="/pegawai"
					class="inline-block px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
				>
					Kembali ke Daftar Pegawai Unit Anda
				</a>
			</div>
		</div>
	{:else if errorMessage || !pegawai}
		<div class="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
			<h2 class="text-lg font-bold text-slate-200">{errorMessage || 'Data tidak ditemukan'}</h2>
			<a href="/pegawai" class="inline-block px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium">
				Kembali ke Daftar Pegawai
			</a>
		</div>
	{:else}
		<!-- Main Profile Hero Card -->
		<div class="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800/80 shadow-2xl relative overflow-hidden">
			<div class="absolute -right-16 -top-16 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

			<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
				<div class="flex items-center gap-5">
					<div class="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-700 to-cyan-500 border-2 border-indigo-400/30 flex items-center justify-center font-extrabold text-2xl text-white shadow-xl shadow-indigo-600/20">
						{pegawai.nama.charAt(0)}
					</div>
					<div class="space-y-1">
						<div class="flex items-center gap-2">
							<span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
								NIP: {pegawai.nip}
							</span>
							<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
								Aktif
							</span>
						</div>
						<h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
							{pegawai.nama}
						</h1>
						<p class="text-slate-400 text-sm font-medium">
							{pegawai.jabatan}
						</p>
					</div>
				</div>

				<div class="flex items-center gap-3">
					<button
						type="button"
						class="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-semibold transition cursor-pointer"
						onclick={() => (showDeleteConfirm = true)}
					>
						Hapus Pegawai
					</button>
				</div>
			</div>
		</div>

		<!-- Detail Grid Sections -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<!-- Box 1: Informasi Profil & Identitas Pegawai -->
			<div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4 shadow-sm">
				<div class="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
					<div class="w-8 h-8 rounded-lg bg-indigo-950/70 border border-indigo-800/50 flex items-center justify-center text-indigo-400">
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
						</svg>
					</div>
					<div>
						<h3 class="font-bold text-white text-base">Identitas Pegawai</h3>
						<p class="text-xs text-slate-400">Data autentikasi dan NIP resmi pegawai</p>
					</div>
				</div>

				<div class="space-y-3 text-sm">
					<div>
						<span class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Lengkap</span>
						<span class="text-slate-100 font-medium text-base">{pegawai.nama}</span>
					</div>
					<div>
						<span class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Nomor Induk Pegawai (NIP)</span>
						<span class="text-indigo-300 font-mono font-medium">{pegawai.nip}</span>
					</div>
					<div>
						<span class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Status Data</span>
						<span class="text-emerald-400 font-medium">Terverifikasi di Database Kepegawaian</span>
					</div>
				</div>
			</div>

			<!-- Box 2: Posisi & Jabatan -->
			<div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4 shadow-sm">
				<div class="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
					<div class="w-8 h-8 rounded-lg bg-cyan-950/70 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
						</svg>
					</div>
					<div>
						<h3 class="font-bold text-white text-base">Jabatan & Penugasan</h3>
						<p class="text-xs text-slate-400">Kedudukan dan peran fungsional/struktural</p>
					</div>
				</div>

				<div class="space-y-3 text-sm">
					<div>
						<span class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Jabatan</span>
						<span class="text-slate-100 font-medium text-base">{pegawai.jabatan}</span>
					</div>
					<div>
						<span class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Kategori Posisi</span>
						<span class="text-slate-300">Aparatur Sipil Negara (ASN)</span>
					</div>
					<div>
						<span class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Hak Akses Modul</span>
						<span class="text-slate-300">Dapat diajukan dalam usulan perbaikan data & promosi</span>
					</div>
				</div>
			</div>

			<!-- Box 3: Unit Organisasi (UNOR) -->
			<div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4 shadow-sm md:col-span-2">
				<div class="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
					<div class="w-8 h-8 rounded-lg bg-emerald-950/70 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
						</svg>
					</div>
					<div>
						<h3 class="font-bold text-white text-base">Unit Organisasi (UNOR) Terkait</h3>
						<p class="text-xs text-slate-400">Satuan kerja atau OPD tempat pegawai terdaftar</p>
					</div>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
					<div>
						<span class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Kode Unit Organisasi</span>
						<span class="inline-block mt-1 px-3 py-1 rounded-lg bg-slate-800 text-indigo-300 font-mono font-semibold border border-slate-700">
							{pegawai.kodeUnor}
						</span>
					</div>
					<div>
						<span class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Unit Organisasi</span>
						<span class="text-slate-100 font-semibold text-base block mt-1">
							{pegawai.namaUnor || pegawai.kodeUnor}
						</span>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Modal Konfirmasi Hapus -->
{#if showDeleteConfirm && pegawai}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
		<div class="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4">
			<div class="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-400 mx-auto">
				<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
			</div>
			<div class="text-center space-y-2">
				<h3 class="text-lg font-bold text-white">Hapus Pegawai</h3>
				<p class="text-xs text-slate-400">
					Anda akan menghapus data pegawai <span class="text-slate-200 font-semibold">{pegawai.nama}</span>. Lanjutkan?
				</p>
			</div>
			<div class="flex items-center justify-center gap-3 pt-2">
				<button
					type="button"
					class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
					onclick={() => (showDeleteConfirm = false)}
				>
					Batal
				</button>
				<button
					type="button"
					class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition cursor-pointer"
					onclick={handleDelete}
				>
					Ya, Hapus
				</button>
			</div>
		</div>
	</div>
{/if}
