<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { authState } from '$lib/stores/auth.svelte';
	import {
		fetchPegawaiList,
		fetchUnorList,
		createPegawai,
		updatePegawai,
		deletePegawai,
		type PegawaiItem,
		type UnorItem
	} from '$lib/api/pegawai';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card';
	import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Dialog } from '$lib/components/ui/dialog';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert';
	import {
		Briefcase,
		Plus,
		Pencil,
		Trash2,
		Eye,
		Search,
		RefreshCw,
		Building2,
		Loader2,
		AlertCircle,
		CheckCircle2,
		Filter
	} from 'lucide-svelte';

	let pegawaiList = $state<PegawaiItem[]>([]);
	let unorList = $state<UnorItem[]>([]);
	let isLoading = $state(false);
	let selectedUnor = $state<string>('');
	let searchQuery = $state('');
	let alertMessage = $state<{ type: 'success' | 'destructive'; title: string; desc: string } | null>(null);

	const userUnorName = $derived(() => {
		if (!authState.user?.kodeUnor) return '';
		const found = unorList.find((u) => u.kodeUnor === authState.user?.kodeUnor);
		return found ? found.namaUnor : authState.user.kodeUnor;
	});

	// Create dialog states
	let isCreateOpen = $state(false);
	let createForm = $state({
		nip: '',
		nama: '',
		jabatan: '',
		kodeUnor: ''
	});
	let isCreating = $state(false);

	// Edit dialog states
	let isEditOpen = $state(false);
	let editingPegawai = $state<PegawaiItem | null>(null);
	let editForm = $state({
		nip: '',
		nama: '',
		jabatan: '',
		kodeUnor: ''
	});
	let isUpdating = $state(false);

	// Delete dialog states
	let isDeleteOpen = $state(false);
	let deletingPegawai = $state<PegawaiItem | null>(null);
	let isDeleting = $state(false);

	async function loadUnors() {
		const res = await fetchUnorList();
		if (res.success && Array.isArray(res.data)) {
			unorList = res.data;
		}
	}

	async function loadPegawai() {
		isLoading = true;
		const params: { kode_unor?: string; search?: string } = {};
		if (selectedUnor) params.kode_unor = selectedUnor;
		if (searchQuery.trim()) params.search = searchQuery.trim();

		const res = await fetchPegawaiList(params);
		isLoading = false;
		if (res.success && Array.isArray(res.data)) {
			pegawaiList = res.data;
		} else {
			alertMessage = {
				type: 'destructive',
				title: 'Gagal Memuat Data Pegawai',
				desc: res.message || 'Tidak dapat mengambil daftar pegawai.'
			};
		}
	}

	let prevParamUnor = $state<string | null>(null);

	onMount(async () => {
		await loadUnors();

		const queryUnor = page.url.searchParams.get('kode_unor');

		// Jika user adalah AdminOPD, otomatis batasi ke kodeUnor miliknya
		if (!authState.isAdmin && authState.user?.kodeUnor) {
			selectedUnor = authState.user.kodeUnor;
			createForm.kodeUnor = authState.user.kodeUnor;
		} else if (queryUnor) {
			selectedUnor = queryUnor;
			createForm.kodeUnor = queryUnor;
		} else if (unorList.length > 0) {
			createForm.kodeUnor = unorList[0].kodeUnor;
		}

		await loadPegawai();
	});

	$effect(() => {
		const currentParam = page.url.searchParams.get('kode_unor');
		if (prevParamUnor === null) {
			prevParamUnor = currentParam;
		} else if (prevParamUnor !== currentParam) {
			prevParamUnor = currentParam;
			if (authState.isAdmin) {
				selectedUnor = currentParam || '';
				loadPegawai();
			}
		}
	});

	function handleFilterChange() {
		loadPegawai();
	}

	function handleSearchSubmit(e: Event) {
		e.preventDefault();
		loadPegawai();
	}

	function resetFilter() {
		if (authState.isAdmin) {
			selectedUnor = '';
		}
		searchQuery = '';
		goto('/pegawai', { replaceState: true });
		loadPegawai();
	}

	function openCreateDialog() {
		createForm = {
			nip: '',
			nama: '',
			jabatan: '',
			kodeUnor: !authState.isAdmin && authState.user?.kodeUnor
				? authState.user.kodeUnor
				: (selectedUnor || unorList[0]?.kodeUnor || '')
		};
		isCreateOpen = true;
	}

	async function handleCreateSubmit(e: Event) {
		e.preventDefault();
		if (!createForm.nip.trim() || !createForm.nama.trim() || !createForm.jabatan.trim() || !createForm.kodeUnor) {
			alertMessage = {
				type: 'destructive',
				title: 'Form Tidak Lengkap',
				desc: 'Seluruh field wajib diisi.'
			};
			return;
		}

		isCreating = true;
		const res = await createPegawai(createForm);
		isCreating = false;

		if (res.success) {
			isCreateOpen = false;
			alertMessage = {
				type: 'success',
				title: 'Berhasil',
				desc: res.message || 'Data pegawai baru berhasil ditambahkan.'
			};
			await loadPegawai();
		} else {
			alertMessage = {
				type: 'destructive',
				title: 'Gagal Menambah Pegawai',
				desc: res.message || 'Terjadi kesalahan pada server.'
			};
		}
	}

	function openEditDialog(item: PegawaiItem) {
		editingPegawai = item;
		editForm = {
			nip: item.nip,
			nama: item.nama,
			jabatan: item.jabatan,
			kodeUnor: item.kodeUnor
		};
		isEditOpen = true;
	}

	async function handleEditSubmit(e: Event) {
		e.preventDefault();
		if (!editingPegawai) return;

		isUpdating = true;
		const res = await updatePegawai(editingPegawai.id, editForm);
		isUpdating = false;

		if (res.success) {
			isEditOpen = false;
			editingPegawai = null;
			alertMessage = {
				type: 'success',
				title: 'Berhasil',
				desc: res.message || 'Data pegawai berhasil diperbarui.'
			};
			await loadPegawai();
		} else {
			alertMessage = {
				type: 'destructive',
				title: 'Gagal Memperbarui Pegawai',
				desc: res.message || 'Terjadi kesalahan pada server.'
			};
		}
	}

	function openDeleteDialog(item: PegawaiItem) {
		deletingPegawai = item;
		isDeleteOpen = true;
	}

	async function handleDeleteConfirm() {
		if (!deletingPegawai) return;

		isDeleting = true;
		const res = await deletePegawai(deletingPegawai.id);
		isDeleting = false;

		if (res.success) {
			isDeleteOpen = false;
			deletingPegawai = null;
			alertMessage = {
				type: 'success',
				title: 'Berhasil',
				desc: res.message || 'Data pegawai berhasil dihapus.'
			};
			await loadPegawai();
		} else {
			alertMessage = {
				type: 'destructive',
				title: 'Gagal Menghapus Pegawai',
				desc: res.message || 'Terjadi kesalahan pada server.'
			};
		}
	}
</script>

<svelte:head>
	<title>Daftar Pegawai - ASN-Sync</title>
</svelte:head>

<div class="space-y-6 max-w-7xl mx-auto">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<div class="flex items-center gap-2 mb-1">
				<Badge variant={authState.isAdmin ? 'default' : 'secondary'} class="text-xs">
					{authState.isAdmin ? 'Akses Pusat' : `Akses Dibatasi: ${userUnorName()}`}
				</Badge>
			</div>
			<h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
				<Briefcase class="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
				<span>Data Pegawai</span>
			</h1>
			<p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
				Pengelolaan data aparatur sipil negara dan penempatan Unit Organisasi (UNOR).
			</p>
		</div>

		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				class="gap-1.5 text-xs h-9"
				onclick={loadPegawai}
				disabled={isLoading}
			>
				<RefreshCw class={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
				<span class="hidden sm:inline">Segarkan</span>
			</Button>

			<Button class="gap-1.5 text-xs h-9 bg-indigo-600 hover:bg-indigo-500 text-white" onclick={openCreateDialog}>
				<Plus class="h-4 w-4" />
				<span>Tambah Pegawai</span>
			</Button>
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
				class="absolute top-3 right-3 text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs"
				onclick={() => alertMessage = null}
			>
				✕
			</button>
		</Alert>
	{/if}

	<!-- Filter & Search Bar -->
	<Card class="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
		<form onsubmit={handleSearchSubmit} class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
			<!-- UNOR Filter (Untuk Admin bisa pilih, untuk AdminOPD terkunci) -->
			<div class="sm:w-72">
				<label for="filter-unor" class="sr-only">Filter Unit Organisasi</label>
				{#if authState.isAdmin}
					<select
						id="filter-unor"
						class="w-full h-10 px-3 rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
						bind:value={selectedUnor}
						onchange={handleFilterChange}
					>
						<option value="">Semua Unit Organisasi</option>
						{#each unorList as u}
							<option value={u.kodeUnor}>{u.namaUnor}</option>
						{/each}
					</select>
				{:else}
					<div class="h-10 px-3 flex items-center gap-2 rounded-md bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs">
						<Building2 class="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
						<span class="truncate font-medium">{userUnorName() || 'Unit Organisasi Anda'}</span>
					</div>
				{/if}
			</div>

			<!-- Search Input -->
			<div class="relative flex-1">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
				<Input
					type="text"
					placeholder="Cari berdasarkan nama atau NIP..."
					class="pl-9 h-10 text-xs"
					bind:value={searchQuery}
				/>
			</div>

			<Button type="submit" variant="secondary" class="h-10 text-xs px-4">
				Cari
			</Button>

			{#if (authState.isAdmin && selectedUnor) || searchQuery}
				<Button
					type="button"
					variant="ghost"
					class="h-10 text-xs px-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
					onclick={resetFilter}
				>
					Reset
				</Button>
			{/if}
		</form>
	</Card>

	<!-- Pegawai Table -->
	<Card class="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
		<CardContent class="p-0">
			{#if isLoading}
				<div class="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
					<Loader2 class="h-6 w-6 animate-spin text-indigo-500 dark:text-indigo-400" />
					<span class="text-xs">Memuat daftar pegawai...</span>
				</div>
			{:else if pegawaiList.length === 0}
				<div class="py-16 text-center space-y-2">
					<Briefcase class="h-8 w-8 text-slate-400 dark:text-slate-600 mx-auto" />
					<div class="text-sm font-semibold text-slate-800 dark:text-slate-300">Tidak ada pegawai ditemukan</div>
					<p class="text-xs text-slate-500 max-w-sm mx-auto">
						{searchQuery || selectedUnor
							? 'Coba ubah kata kunci pencarian atau filter unit organisasi.'
							: 'Belum ada data pegawai terdaftar dalam sistem.'}
					</p>
				</div>
			{:else}
				<Table>
					<TableHeader>
						<TableRow class="hover:bg-transparent border-b border-slate-200 dark:border-slate-800">
							<TableHead class="w-12 text-center text-slate-600 dark:text-slate-400">No</TableHead>
							<TableHead class="w-48 text-slate-600 dark:text-slate-400">NIP</TableHead>
							<TableHead class="text-slate-600 dark:text-slate-400">Nama Pegawai</TableHead>
							<TableHead class="text-slate-600 dark:text-slate-400">Jabatan</TableHead>
							<TableHead class="text-slate-600 dark:text-slate-400">Unit Organisasi</TableHead>
							<TableHead class="w-32 text-right text-slate-600 dark:text-slate-400">Aksi</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each pegawaiList as item, index}
							<TableRow class="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
								<TableCell class="text-xs text-slate-400 dark:text-slate-500 font-mono text-center">
									{index + 1}
								</TableCell>
								<TableCell>
									<div class="flex items-center gap-3">
										<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold text-xs border border-slate-200 dark:border-slate-700">
											{item.nama.charAt(0).toUpperCase()}
										</div>
										<div>
											<a
												href="/pegawai/{item.id}"
												class="text-xs font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition"
											>
												{item.nama}
											</a>
										</div>
									</div>
								</TableCell>
								<TableCell class="font-mono text-xs text-indigo-600 dark:text-indigo-400">
									{item.nip}
								</TableCell>
								<TableCell class="text-xs text-slate-700 dark:text-slate-300">
									{item.jabatan}
								</TableCell>
								<TableCell>
									<Badge variant="outline" class="font-normal text-xs bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
										<Building2 class="mr-1 h-3 w-3 text-indigo-600 dark:text-indigo-400" />
										<span>{item.namaUnor || (unorList.find((u) => u.kodeUnor === item.kodeUnor)?.namaUnor) || '-'}</span>
									</Badge>
								</TableCell>
								<TableCell class="text-right pr-6">
									<div class="flex items-center justify-end gap-1.5">
										<!-- Detail Page -->
										<Button
											href="/pegawai/{item.id}"
											variant="ghost"
											size="sm"
											class="h-8 w-8 p-0 text-slate-400 hover:text-indigo-400 hover:bg-slate-800"
											title="Lihat Detail"
										>
											<Eye class="h-3.5 w-3.5" />
										</Button>

										<!-- Edit Pegawai -->
										<Button
											variant="ghost"
											size="sm"
											class="h-8 w-8 p-0 text-slate-400 hover:text-amber-400 hover:bg-slate-800"
											onclick={() => openEditDialog(item)}
											title="Ubah Data"
										>
											<Pencil class="h-3.5 w-3.5" />
										</Button>

										<!-- Delete Pegawai -->
										<Button
											variant="ghost"
											size="sm"
											class="h-8 w-8 p-0 text-slate-400 hover:text-rose-400 hover:bg-slate-800"
											onclick={() => openDeleteDialog(item)}
											title="Hapus Data"
										>
											<Trash2 class="h-3.5 w-3.5" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			{/if}
		</CardContent>
	</Card>
</div>

<!-- Dialog Tambah Pegawai -->
<Dialog
	bind:open={isCreateOpen}
	title="Tambah Pegawai Baru"
	description="Daftarkan data pegawai aparatur ke dalam unit organisasi."
	onclose={() => isCreateOpen = false}
>
	<form onsubmit={handleCreateSubmit} class="space-y-4">
		<div class="space-y-1.5">
			<Label for="create-nip" class="text-xs text-slate-700 dark:text-slate-300">NIP (Nomor Induk Pegawai) *</Label>
			<Input
				id="create-nip"
				type="text"
				placeholder="Contoh: 198501012010011001"
				required
				bind:value={createForm.nip}
				class="font-mono text-xs"
			/>
		</div>

		<div class="space-y-1.5">
			<Label for="create-nama" class="text-xs text-slate-700 dark:text-slate-300">Nama Lengkap *</Label>
			<Input
				id="create-nama"
				type="text"
				placeholder="Nama lengkap pegawai beserta gelar"
				required
				bind:value={createForm.nama}
				class="text-xs"
			/>
		</div>

		<div class="space-y-1.5">
			<Label for="create-jabatan" class="text-xs text-slate-700 dark:text-slate-300">Jabatan *</Label>
			<Input
				id="create-jabatan"
				type="text"
				placeholder="Contoh: Kepala Seksi, Analis Kepegawaian..."
				required
				bind:value={createForm.jabatan}
				class="text-xs"
			/>
		</div>

		<div class="space-y-1.5">
			<Label for="create-unor" class="text-xs text-slate-700 dark:text-slate-300">Unit Organisasi (UNOR) *</Label>
			{#if authState.isAdmin}
				<select
					id="create-unor"
					required
					class="w-full h-10 px-3 rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
					bind:value={createForm.kodeUnor}
				>
					{#each unorList as u}
						<option value={u.kodeUnor}>{u.namaUnor}</option>
					{/each}
				</select>
			{:else}
				<Input
					id="create-unor"
					type="text"
					readonly
					disabled
					value={userUnorName() || 'Unit Organisasi Anda'}
					class="text-xs bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
				/>
				<p class="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
					Sebagai Admin OPD, pegawai otomatis dialokasikan ke Unit Organisasi Anda.
				</p>
			{/if}
		</div>

		<div class="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
			<Button
				type="button"
				variant="outline"
				size="sm"
				class="text-xs"
				onclick={() => isCreateOpen = false}
			>
				Batal
			</Button>
			<Button
				type="submit"
				size="sm"
				class="text-xs bg-indigo-600 hover:bg-indigo-500 text-white"
				disabled={isCreating}
			>
				{#if isCreating}
					<Loader2 class="mr-1.5 h-3.5 w-3.5 animate-spin" />
					<span>Menyimpan...</span>
				{:else}
					<span>Simpan Pegawai</span>
				{/if}
			</Button>
		</div>
	</form>
</Dialog>

<!-- Dialog Ubah Pegawai -->
<Dialog
	bind:open={isEditOpen}
	title="Ubah Data Pegawai"
	description="Perbarui informasi data pegawai."
	onclose={() => isEditOpen = false}
>
	<form onsubmit={handleEditSubmit} class="space-y-4">
		<div class="space-y-1.5">
			<Label for="edit-nip" class="text-xs text-slate-700 dark:text-slate-300">NIP (Nomor Induk Pegawai) *</Label>
			<Input
				id="edit-nip"
				type="text"
				required
				bind:value={editForm.nip}
				class="font-mono text-xs"
			/>
		</div>

		<div class="space-y-1.5">
			<Label for="edit-nama" class="text-xs text-slate-700 dark:text-slate-300">Nama Lengkap *</Label>
			<Input
				id="edit-nama"
				type="text"
				required
				bind:value={editForm.nama}
				class="text-xs"
			/>
		</div>

		<div class="space-y-1.5">
			<Label for="edit-jabatan" class="text-xs text-slate-700 dark:text-slate-300">Jabatan *</Label>
			<Input
				id="edit-jabatan"
				type="text"
				required
				bind:value={editForm.jabatan}
				class="text-xs"
			/>
		</div>

		{#if authState.isAdmin}
			<div class="space-y-1.5">
				<Label for="edit-unor" class="text-xs text-slate-700 dark:text-slate-300">Unit Organisasi (UNOR) *</Label>
				<select
					id="edit-unor"
					required
					class="w-full h-10 px-3 rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
					bind:value={editForm.kodeUnor}
				>
					{#each unorList as u}
						<option value={u.kodeUnor}>{u.namaUnor}</option>
					{/each}
				</select>
			</div>
		{/if}

		<div class="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
			<Button
				type="button"
				variant="outline"
				size="sm"
				class="text-xs"
				onclick={() => isEditOpen = false}
			>
				Batal
			</Button>
			<Button
				type="submit"
				size="sm"
				class="text-xs bg-indigo-600 hover:bg-indigo-500 text-white"
				disabled={isUpdating}
			>
				{#if isUpdating}
					<Loader2 class="mr-1.5 h-3.5 w-3.5 animate-spin" />
					<span>Memperbarui...</span>
				{:else}
					<span>Simpan Perubahan</span>
				{/if}
			</Button>
		</div>
	</form>
</Dialog>

<!-- Dialog Konfirmasi Hapus -->
<Dialog
	bind:open={isDeleteOpen}
	title="Hapus Data Pegawai"
	description="Konfirmasi penghapusan data aparatur sipil."
	onclose={() => isDeleteOpen = false}
>
	<div class="space-y-4">
		<p class="text-xs text-slate-700 dark:text-slate-300">
			Apakah Anda yakin ingin menghapus data pegawai
			<span class="font-semibold text-slate-900 dark:text-white">{deletingPegawai?.nama}</span>
			(NIP: <span class="font-mono text-indigo-600 dark:text-indigo-400">{deletingPegawai?.nip}</span>)?
			Tindakan ini tidak dapat dibatalkan.
		</p>

		<div class="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
			<Button
				type="button"
				variant="outline"
				size="sm"
				class="text-xs"
				onclick={() => isDeleteOpen = false}
			>
				Batal
			</Button>
			<Button
				type="button"
				variant="destructive"
				size="sm"
				class="text-xs"
				onclick={handleDeleteConfirm}
				disabled={isDeleting}
			>
				{#if isDeleting}
					<Loader2 class="mr-1.5 h-3.5 w-3.5 animate-spin" />
					<span>Menghapus...</span>
				{:else}
					<span>Ya, Hapus</span>
				{/if}
			</Button>
		</div>
	</div>
</Dialog>
