<script lang="ts">
	import { onMount } from 'svelte';
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

	onMount(async () => {
		await loadUnors();

		// Jika user adalah AdminOPD, otomatis batasi ke kodeUnor miliknya
		if (!authState.isAdmin && authState.user?.kodeUnor) {
			selectedUnor = authState.user.kodeUnor;
			createForm.kodeUnor = authState.user.kodeUnor;
		} else if (unorList.length > 0) {
			createForm.kodeUnor = unorList[0].kodeUnor;
		}

		await loadPegawai();
	});

	function handleFilterChange() {
		loadPegawai();
	}

	function handleSearchSubmit(e: Event) {
		e.preventDefault();
		loadPegawai();
	}

	function openCreateDialog() {
		createForm = {
			nip: '',
			nama: '',
			jabatan: '',
			kodeUnor: !authState.isAdmin && authState.user?.kodeUnor ? authState.user.kodeUnor : (unorList[0]?.kodeUnor || '')
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
	<title>Daftar Pegawai - Usul Data</title>
</svelte:head>

<div class="space-y-6 max-w-7xl mx-auto">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<div class="flex items-center gap-2 mb-1">
				<Badge variant={authState.isAdmin ? 'default' : 'secondary'} class="text-xs">
					{authState.isAdmin ? 'Akses Pusat' : `Akses Dibatasi: ${authState.user?.kodeUnor}`}
				</Badge>
			</div>
			<h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
				<Briefcase class="h-7 w-7 text-indigo-400" />
				<span>Data Pegawai</span>
			</h1>
			<p class="text-sm text-slate-400 mt-1">
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

			<Button class="gap-1.5 text-xs h-9 bg-indigo-600 hover:bg-indigo-500" onclick={openCreateDialog}>
				<Plus class="h-4 w-4" />
				<span>Tambah Pegawai</span>
			</Button>
		</div>
	</div>

	<!-- Alert Messages -->
	{#if alertMessage}
		<Alert variant={alertMessage.type} class="relative">
			{#if alertMessage.type === 'success'}
				<CheckCircle2 class="h-4 w-4 text-emerald-400" />
			{:else}
				<AlertCircle class="h-4 w-4 text-rose-400" />
			{/if}
			<AlertTitle>{alertMessage.title}</AlertTitle>
			<AlertDescription>{alertMessage.desc}</AlertDescription>
			<button
				type="button"
				class="absolute top-3 right-3 text-slate-400 hover:text-white text-xs"
				onclick={() => alertMessage = null}
			>
				✕
			</button>
		</Alert>
	{/if}

	<!-- Filter & Search Bar -->
	<Card class="border-slate-800 bg-slate-900/60 p-4">
		<form onsubmit={handleSearchSubmit} class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
			<!-- UNOR Filter (Untuk Admin bisa pilih, untuk AdminOPD terkunci) -->
			<div class="sm:w-64">
				<label for="filter-unor" class="sr-only">Filter Unit Organisasi</label>
				{#if authState.isAdmin}
					<select
						id="filter-unor"
						class="w-full h-10 px-3 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
						bind:value={selectedUnor}
						onchange={handleFilterChange}
					>
						<option value="">Semua Unit Organisasi (UNOR)</option>
						{#each unorList as u}
							<option value={u.kodeUnor}>{u.namaUnor} ({u.kodeUnor})</option>
						{/each}
					</select>
				{:else}
					<div class="h-10 px-3 flex items-center gap-2 rounded-md bg-slate-950/80 border border-slate-800 text-slate-300 text-xs font-mono">
						<Building2 class="h-3.5 w-3.5 text-indigo-400" />
						<span class="truncate">{authState.user?.kodeUnor || 'UNOR Terkunci'}</span>
					</div>
				{/if}
			</div>

			<!-- Search Input -->
			<div class="relative flex-1">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
				<Input
					type="text"
					placeholder="Cari berdasarkan nama atau NIP..."
					class="pl-9 h-10 text-xs bg-slate-950 border-slate-800"
					bind:value={searchQuery}
				/>
			</div>

			<Button type="submit" variant="secondary" class="h-10 text-xs px-4">
				Cari
			</Button>
		</form>
	</Card>

	<!-- Pegawai Table -->
	<Card class="border-slate-800 bg-slate-900/40">
		<CardContent class="p-0">
			{#if isLoading}
				<div class="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
					<Loader2 class="h-6 w-6 animate-spin text-indigo-400" />
					<span class="text-xs">Memuat daftar pegawai...</span>
				</div>
			{:else if pegawaiList.length === 0}
				<div class="py-16 text-center space-y-2">
					<Briefcase class="h-8 w-8 text-slate-600 mx-auto" />
					<div class="text-sm font-semibold text-slate-300">Tidak ada pegawai ditemukan</div>
					<p class="text-xs text-slate-500 max-w-sm mx-auto">
						{searchQuery || selectedUnor
							? 'Coba ubah kata kunci pencarian atau filter unit organisasi.'
							: 'Belum ada data pegawai terdaftar dalam sistem.'}
					</p>
				</div>
			{:else}
				<Table>
					<TableHeader>
						<TableRow class="hover:bg-transparent border-slate-800">
							<TableHead class="w-12 text-slate-400">No</TableHead>
							<TableHead class="text-slate-400">Pegawai</TableHead>
							<TableHead class="text-slate-400">NIP</TableHead>
							<TableHead class="text-slate-400">Jabatan</TableHead>
							<TableHead class="text-slate-400">Unit Organisasi</TableHead>
							<TableHead class="text-right text-slate-400 pr-6">Aksi</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each pegawaiList as item, index}
							<TableRow class="border-slate-800/60 hover:bg-slate-800/40 transition">
								<TableCell class="text-xs text-slate-500 font-mono">
									{index + 1}
								</TableCell>
								<TableCell>
									<div class="flex items-center gap-3">
										<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-indigo-400 font-semibold text-xs border border-slate-700">
											{item.nama.charAt(0).toUpperCase()}
										</div>
										<div>
											<a
												href="/pegawai/{item.id}"
												class="text-xs font-semibold text-white hover:text-indigo-400 transition"
											>
												{item.nama}
											</a>
										</div>
									</div>
								</TableCell>
								<TableCell class="font-mono text-xs text-slate-300">
									{item.nip}
								</TableCell>
								<TableCell class="text-xs text-slate-300">
									{item.jabatan}
								</TableCell>
								<TableCell>
									<Badge variant="outline" class="font-normal text-xs bg-slate-900 border-slate-700 text-slate-300">
										<Building2 class="mr-1 h-3 w-3 text-indigo-400" />
										<span>{item.namaUnor || item.kodeUnor}</span>
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
	isOpen={isCreateOpen}
	title="Tambah Pegawai Baru"
	description="Daftarkan data pegawai aparatur ke dalam unit organisasi."
	onclose={() => isCreateOpen = false}
>
	<form onsubmit={handleCreateSubmit} class="space-y-4">
		<div class="space-y-1.5">
			<Label for="create-nip" class="text-xs text-slate-300">NIP (Nomor Induk Pegawai) *</Label>
			<Input
				id="create-nip"
				type="text"
				placeholder="Contoh: 198501012010011001"
				required
				bind:value={createForm.nip}
				class="font-mono text-xs bg-slate-950 border-slate-800"
			/>
		</div>

		<div class="space-y-1.5">
			<Label for="create-nama" class="text-xs text-slate-300">Nama Lengkap *</Label>
			<Input
				id="create-nama"
				type="text"
				placeholder="Nama lengkap pegawai beserta gelar"
				required
				bind:value={createForm.nama}
				class="text-xs bg-slate-950 border-slate-800"
			/>
		</div>

		<div class="space-y-1.5">
			<Label for="create-jabatan" class="text-xs text-slate-300">Jabatan *</Label>
			<Input
				id="create-jabatan"
				type="text"
				placeholder="Contoh: Kepala Seksi, Analis Kepegawaian..."
				required
				bind:value={createForm.jabatan}
				class="text-xs bg-slate-950 border-slate-800"
			/>
		</div>

		<div class="space-y-1.5">
			<Label for="create-unor" class="text-xs text-slate-300">Unit Organisasi (UNOR) *</Label>
			{#if authState.isAdmin}
				<select
					id="create-unor"
					required
					class="w-full h-10 px-3 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
					bind:value={createForm.kodeUnor}
				>
					{#each unorList as u}
						<option value={u.kodeUnor}>{u.namaUnor} ({u.kodeUnor})</option>
					{/each}
				</select>
			{:else}
				<Input
					id="create-unor"
					type="text"
					readonly
					disabled
					value={unorList.find(u => u.kodeUnor === authState.user?.kodeUnor)?.namaUnor || authState.user?.kodeUnor || ''}
					class="text-xs bg-slate-900 border-slate-800 text-slate-400 cursor-not-allowed"
				/>
				<p class="text-[11px] text-amber-400 mt-1">
					Sebagai Admin OPD, pegawai otomatis dialokasikan ke Unit Organisasi Anda.
				</p>
			{/if}
		</div>

		<div class="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
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
				class="text-xs bg-indigo-600 hover:bg-indigo-500"
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
	isOpen={isEditOpen}
	title="Ubah Data Pegawai"
	description="Perbarui informasi data pegawai."
	onclose={() => isEditOpen = false}
>
	<form onsubmit={handleEditSubmit} class="space-y-4">
		<div class="space-y-1.5">
			<Label for="edit-nip" class="text-xs text-slate-300">NIP (Nomor Induk Pegawai) *</Label>
			<Input
				id="edit-nip"
				type="text"
				required
				bind:value={editForm.nip}
				class="font-mono text-xs bg-slate-950 border-slate-800"
			/>
		</div>

		<div class="space-y-1.5">
			<Label for="edit-nama" class="text-xs text-slate-300">Nama Lengkap *</Label>
			<Input
				id="edit-nama"
				type="text"
				required
				bind:value={editForm.nama}
				class="text-xs bg-slate-950 border-slate-800"
			/>
		</div>

		<div class="space-y-1.5">
			<Label for="edit-jabatan" class="text-xs text-slate-300">Jabatan *</Label>
			<Input
				id="edit-jabatan"
				type="text"
				required
				bind:value={editForm.jabatan}
				class="text-xs bg-slate-950 border-slate-800"
			/>
		</div>

		{#if authState.isAdmin}
			<div class="space-y-1.5">
				<Label for="edit-unor" class="text-xs text-slate-300">Unit Organisasi (UNOR) *</Label>
				<select
					id="edit-unor"
					required
					class="w-full h-10 px-3 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
					bind:value={editForm.kodeUnor}
				>
					{#each unorList as u}
						<option value={u.kodeUnor}>{u.namaUnor} ({u.kodeUnor})</option>
					{/each}
				</select>
			</div>
		{/if}

		<div class="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
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
				class="text-xs bg-indigo-600 hover:bg-indigo-500"
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
	isOpen={isDeleteOpen}
	title="Hapus Data Pegawai"
	description="Konfirmasi penghapusan data aparatur sipil."
	onclose={() => isDeleteOpen = false}
>
	<div class="space-y-4">
		<p class="text-xs text-slate-300">
			Apakah Anda yakin ingin menghapus data pegawai
			<span class="font-semibold text-white">{deletingPegawai?.nama}</span>
			(NIP: <span class="font-mono text-indigo-400">{deletingPegawai?.nip}</span>)?
			Tindakan ini tidak dapat dibatalkan.
		</p>

		<div class="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
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
