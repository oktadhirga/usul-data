<script lang="ts">
	import { onMount } from 'svelte';
	import {
		fetchPegawaiList,
		fetchUnorList,
		createPegawai,
		updatePegawai,
		deletePegawai,
		getActiveUser
	} from '$lib/api';
	import type { Pegawai, Unor, UserProfile } from '$lib/types/kepegawaian';

	let activeUser = $state<UserProfile>(getActiveUser());
	let unors = $state<Unor[]>([]);
	let pegawais = $state<Pegawai[]>([]);
	let selectedUnor = $state<string>('');
	let searchQuery = $state<string>('');
	let isLoading = $state<boolean>(true);
	let errorMessage = $state<string>('');
	let successMessage = $state<string>('');

	// Modal State
	let isModalOpen = $state<boolean>(false);
	let modalMode = $state<'create' | 'edit'>('create');
	let editingId = $state<number | null>(null);
	let formNip = $state<string>('');
	let formNama = $state<string>('');
	let formJabatan = $state<string>('');
	let formKodeUnor = $state<string>('');
	let formError = $state<string>('');
	let isSubmitting = $state<boolean>(false);

	// Delete confirm state
	let deletingPegawai = $state<Pegawai | null>(null);

	async function loadData() {
		isLoading = true;
		errorMessage = '';
		try {
			activeUser = getActiveUser();
			const [unorData, pegawaiData] = await Promise.all([
				fetchUnorList(),
				fetchPegawaiList({
					kodeUnor: selectedUnor,
					search: searchQuery
				})
			]);
			unors = unorData;
			pegawais = pegawaiData;

			// Jika user AdminOPD, pastikan selectedUnor terkunci ke kodeUnor miliknya
			if (activeUser.role === 'AdminOPD' && activeUser.kodeUnor) {
				selectedUnor = activeUser.kodeUnor;
			}
		} catch (err: any) {
			errorMessage = err.message || 'Gagal memuat data kepegawaian';
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		loadData();

		const handleUserChange = () => {
			activeUser = getActiveUser();
			if (activeUser.role === 'AdminOPD' && activeUser.kodeUnor) {
				selectedUnor = activeUser.kodeUnor;
			} else {
				selectedUnor = '';
			}
			loadData();
		};

		window.addEventListener('user-changed', handleUserChange);
		return () => {
			window.removeEventListener('user-changed', handleUserChange);
		};
	});

	async function handleFilterChange() {
		isLoading = true;
		try {
			pegawais = await fetchPegawaiList({
				kodeUnor: selectedUnor,
				search: searchQuery
			});
		} catch (err: any) {
			errorMessage = err.message || 'Gagal memfilter data pegawai';
		} finally {
			isLoading = false;
		}
	}

	function openCreateModal() {
		modalMode = 'create';
		editingId = null;
		formNip = '';
		formNama = '';
		formJabatan = '';
		formKodeUnor = activeUser.role === 'AdminOPD' && activeUser.kodeUnor ? activeUser.kodeUnor : (selectedUnor || (unors[0]?.kodeUnor ?? ''));
		formError = '';
		isModalOpen = true;
	}

	function openEditModal(p: Pegawai) {
		modalMode = 'edit';
		editingId = p.id;
		formNip = p.nip;
		formNama = p.nama;
		formJabatan = p.jabatan;
		formKodeUnor = p.kodeUnor;
		formError = '';
		isModalOpen = true;
	}

	function closeModal() {
		isModalOpen = false;
		formError = '';
	}

	async function handleSubmitForm(e: SubmitEvent) {
		e.preventDefault();
		formError = '';
		isSubmitting = true;

		try {
			if (!formNip.trim() || !formNama.trim() || !formJabatan.trim() || !formKodeUnor.trim()) {
				throw new Error('Semua bidang formulir wajib diisi');
			}

			if (modalMode === 'create') {
				const res = await createPegawai({
					nip: formNip.trim(),
					nama: formNama.trim(),
					jabatan: formJabatan.trim(),
					kodeUnor: formKodeUnor
				});
				if (res.success) {
					successMessage = 'Pegawai baru berhasil ditambahkan!';
					closeModal();
					await loadData();
				} else {
					formError = res.message || 'Gagal menambahkan pegawai';
				}
			} else if (modalMode === 'edit' && editingId !== null) {
				const res = await updatePegawai(editingId, {
					nip: formNip.trim(),
					nama: formNama.trim(),
					jabatan: formJabatan.trim(),
					kodeUnor: formKodeUnor
				});
				if (res.success) {
					successMessage = 'Data pegawai berhasil diperbarui!';
					closeModal();
					await loadData();
				} else {
					formError = res.message || 'Gagal memperbarui pegawai';
				}
			}
		} catch (err: any) {
			formError = err.message || 'Terjadi kesalahan saat menyimpan data';
		} finally {
			isSubmitting = false;
		}
	}

	async function handleDeletePegawai() {
		if (!deletingPegawai) return;
		try {
			const res = await deletePegawai(deletingPegawai.id);
			if (res.success) {
				successMessage = `Pegawai ${deletingPegawai.nama} berhasil dihapus`;
				deletingPegawai = null;
				await loadData();
			} else {
				errorMessage = res.message || 'Gagal menghapus pegawai';
			}
		} catch (err: any) {
			errorMessage = err.message || 'Terjadi kesalahan saat menghapus pegawai';
		}
	}
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
		<div>
			<div class="flex items-center gap-2 mb-1">
				<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950/80 text-indigo-400 border border-indigo-800/60">
					Modul Kepegawaian
				</span>
				{#if activeUser.role === 'AdminOPD'}
					<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/60">
						Akses Dibatasi: {activeUser.kodeUnor}
					</span>
				{:else}
					<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
						Akses Pusat (Semua UNOR)
					</span>
				{/if}
			</div>
			<h1 class="text-3xl font-extrabold text-white tracking-tight">Daftar Pegawai per Unit Organisasi</h1>
			<p class="text-slate-400 text-sm mt-1">
				Kelola informasi data aparatur sipil dan struktur kepegawaian berdasarkan Unit Organisasi (UNOR).
			</p>
		</div>

		<div>
			<button
				type="button"
				id="btn-tambah-pegawai"
				class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/30 cursor-pointer"
				onclick={openCreateModal}
			>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				Tambah Pegawai
			</button>
		</div>
	</div>

	<!-- Alert Messages -->
	{#if successMessage}
		<div class="p-4 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-sm flex items-center justify-between">
			<div class="flex items-center gap-2">
				<svg class="w-5 h-5 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
				</svg>
				<span>{successMessage}</span>
			</div>
			<button type="button" class="text-emerald-400 hover:text-emerald-200" onclick={() => (successMessage = '')}>✕</button>
		</div>
	{/if}

	{#if errorMessage}
		<div class="p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-sm flex items-center justify-between">
			<div class="flex items-center gap-2">
				<svg class="w-5 h-5 text-rose-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
				</svg>
				<span>{errorMessage}</span>
			</div>
			<button type="button" class="text-rose-400 hover:text-rose-200" onclick={() => (errorMessage = '')}>✕</button>
		</div>
	{/if}

	<!-- Filter & Search Controls -->
	<div class="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-sm flex flex-col md:flex-row items-center gap-4">
		<!-- Dropdown Filter UNOR -->
		<div class="w-full md:w-72">
			<label for="filter-unor" class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
				Filter Unit Organisasi (UNOR)
			</label>
			{#if activeUser.role === 'AdminOPD'}
				<div class="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-sm flex items-center justify-between">
					<span>{unors.find((u) => u.kodeUnor === activeUser.kodeUnor)?.namaUnor || activeUser.kodeUnor}</span>
					<span class="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">Terkunci</span>
				</div>
			{:else}
				<select
					id="filter-unor"
					class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-200 text-sm cursor-pointer transition"
					bind:value={selectedUnor}
					onchange={handleFilterChange}
				>
					<option value="">Semua Unit Organisasi</option>
					{#each unors as u}
						<option value={u.kodeUnor}>{u.namaUnor} ({u.kodeUnor})</option>
					{/each}
				</select>
			{/if}
		</div>

		<!-- Search Input -->
		<div class="w-full md:flex-1">
			<label for="search-pegawai" class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
				Pencarian Pegawai
			</label>
			<div class="relative">
				<input
					type="text"
					id="search-pegawai"
					placeholder="Cari berdasarkan nama, NIP, atau jabatan..."
					class="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-200 text-sm placeholder-slate-500 transition"
					bind:value={searchQuery}
					oninput={handleFilterChange}
				/>
				<svg class="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
			</div>
		</div>

		<!-- Reset Button -->
		{#if selectedUnor || searchQuery}
			<div class="self-end pt-5 w-full md:w-auto">
				<button
					type="button"
					class="w-full md:w-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
					onclick={() => {
						if (activeUser.role !== 'AdminOPD') selectedUnor = '';
						searchQuery = '';
						handleFilterChange();
					}}
				>
					Reset Filter
				</button>
			</div>
		{/if}
	</div>

	<!-- Pegawai Data Table -->
	<div class="rounded-2xl border border-slate-800/90 bg-slate-900/50 backdrop-blur-md overflow-hidden shadow-xl">
		{#if isLoading}
			<div class="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
				<div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
				<span class="text-sm">Memuat data pegawai...</span>
			</div>
		{:else if pegawais.length === 0}
			<div class="py-16 text-center text-slate-400 space-y-3">
				<div class="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
					<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
					</svg>
				</div>
				<h3 class="text-base font-semibold text-slate-200">Tidak ada data pegawai ditemukan</h3>
				<p class="text-xs text-slate-500 max-w-sm mx-auto">
					{searchQuery ? 'Coba sesuaikan kata kunci pencarian Anda.' : 'Belum ada data pegawai untuk unit organisasi ini.'}
				</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left text-sm">
					<thead class="bg-slate-950/70 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
						<tr>
							<th class="py-3.5 px-4 w-12 text-center">No</th>
							<th class="py-3.5 px-4">NIP</th>
							<th class="py-3.5 px-4">Nama Lengkap</th>
							<th class="py-3.5 px-4">Jabatan</th>
							<th class="py-3.5 px-4">Unit Organisasi (UNOR)</th>
							<th class="py-3.5 px-4 text-center w-36">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-800/60 text-slate-300">
						{#each pegawais as p, idx}
							<tr class="hover:bg-slate-800/40 transition">
								<td class="py-3.5 px-4 text-center text-slate-500 font-mono">{idx + 1}</td>
								<td class="py-3.5 px-4 font-mono text-xs text-indigo-300 font-semibold">{p.nip}</td>
								<td class="py-3.5 px-4 font-medium text-white flex items-center gap-3">
									<div class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-300 shrink-0">
										{p.nama.charAt(0)}
									</div>
									<span>{p.nama}</span>
								</td>
								<td class="py-3.5 px-4 text-slate-300">{p.jabatan}</td>
								<td class="py-3.5 px-4">
									<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-200 border border-slate-700">
										<span class="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
										{p.namaUnor || p.kodeUnor}
									</span>
								</td>
								<td class="py-3.5 px-4 text-center">
									<div class="flex items-center justify-center gap-1.5">
										<!-- Detail Link -->
										<a
											href="/pegawai/{p.id}"
											class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition"
											title="Lihat Detail"
										>
											<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
											</svg>
										</a>

										<!-- Edit Button -->
										<button
											type="button"
											class="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition cursor-pointer"
											title="Edit Data"
											onclick={() => openEditModal(p)}
										>
											<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
											</svg>
										</button>

										<!-- Delete Button -->
										<button
											type="button"
											class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
											title="Hapus Pegawai"
											onclick={() => (deletingPegawai = p)}
										>
											<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<!-- Modal Tambah / Edit Pegawai -->
{#if isModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
		<div class="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5">
			<div class="flex items-center justify-between border-b border-slate-800 pb-4">
				<h3 class="text-lg font-bold text-white">
					{modalMode === 'create' ? 'Tambah Pegawai Baru' : 'Perbarui Data Pegawai'}
				</h3>
				<button type="button" class="text-slate-400 hover:text-white" onclick={closeModal}>✕</button>
			</div>

			{#if formError}
				<div class="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
					{formError}
				</div>
			{/if}

			<form onsubmit={handleSubmitForm} class="space-y-4">
				<div>
					<label for="form-nip" class="block text-xs font-semibold text-slate-400 mb-1">
						Nomor Induk Pegawai (NIP) *
					</label>
					<input
						type="text"
						id="form-nip"
						required
						placeholder="Contoh: 198501012010011001"
						class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-200 text-sm font-mono"
						bind:value={formNip}
					/>
				</div>

				<div>
					<label for="form-nama" class="block text-xs font-semibold text-slate-400 mb-1">
						Nama Lengkap Pegawai *
					</label>
					<input
						type="text"
						id="form-nama"
						required
						placeholder="Nama lengkap beserta gelar..."
						class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-200 text-sm"
						bind:value={formNama}
					/>
				</div>

				<div>
					<label for="form-jabatan" class="block text-xs font-semibold text-slate-400 mb-1">
						Jabatan *
					</label>
					<input
						type="text"
						id="form-jabatan"
						required
						placeholder="Contoh: Kepala Seksi, Analis Kepegawaian..."
						class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-200 text-sm"
						bind:value={formJabatan}
					/>
				</div>

				<div>
					<label for="form-unor" class="block text-xs font-semibold text-slate-400 mb-1">
						Unit Organisasi (UNOR) *
					</label>
					{#if activeUser.role === 'AdminOPD'}
						<input
							type="text"
							readonly
							disabled
							value={unors.find((u) => u.kodeUnor === activeUser.kodeUnor)?.namaUnor || activeUser.kodeUnor}
							class="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-sm cursor-not-allowed"
						/>
						<p class="text-[11px] text-amber-400 mt-1">
							Sebagai Admin OPD, pegawai otomatis dialokasikan ke Unit Organisasi Anda ({activeUser.kodeUnor}).
						</p>
					{:else}
						<select
							id="form-unor"
							required
							class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-200 text-sm"
							bind:value={formKodeUnor}
						>
							{#each unors as u}
								<option value={u.kodeUnor}>{u.namaUnor} ({u.kodeUnor})</option>
							{/each}
						</select>
					{/if}
				</div>

				<div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
					<button
						type="button"
						class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
						onclick={closeModal}
					>
						Batal
					</button>
					<button
						type="submit"
						disabled={isSubmitting}
						class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition shadow-md shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
					>
						{isSubmitting ? 'Menyimpan...' : modalMode === 'create' ? 'Simpan Pegawai' : 'Perbarui'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Modal Konfirmasi Hapus -->
{#if deletingPegawai}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
		<div class="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4">
			<div class="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-400 mx-auto">
				<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
			</div>
			<div class="text-center space-y-2">
				<h3 class="text-lg font-bold text-white">Konfirmasi Hapus Pegawai</h3>
				<p class="text-xs text-slate-400">
					Apakah Anda yakin ingin menghapus data pegawai <span class="text-slate-200 font-semibold">{deletingPegawai.nama}</span> (NIP: {deletingPegawai.nip})? Tindakan ini tidak dapat dibatalkan.
				</p>
			</div>
			<div class="flex items-center justify-center gap-3 pt-2">
				<button
					type="button"
					class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
					onclick={() => (deletingPegawai = null)}
				>
					Batal
				</button>
				<button
					type="button"
					class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition cursor-pointer"
					onclick={handleDeletePegawai}
				>
					Ya, Hapus Data
				</button>
			</div>
		</div>
	</div>
{/if}
