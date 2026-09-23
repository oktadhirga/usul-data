<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authState } from '$lib/stores/auth.svelte';
	import {
		fetchUsers,
		createUser,
		updateUser,
		deleteUser,
		type UserItem
	} from '$lib/api/users';
	import { fetchUnorList, type UnorItem } from '$lib/api/pegawai';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card';
	import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Dialog } from '$lib/components/ui/dialog';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert';
	import {
		UserPlus,
		Pencil,
		Trash2,
		Shield,
		Search,
		RefreshCw,
		AlertCircle,
		CheckCircle2,
		Building2,
		Loader2
	} from 'lucide-svelte';

	let users = $state<UserItem[]>([]);
	let unorList = $state<UnorItem[]>([]);
	let isLoading = $state(false);
	let isLoadingUnor = $state(false);
	let searchQuery = $state('');
	let alertMessage = $state<{ type: 'success' | 'destructive'; title: string; desc: string } | null>(null);

	// Create dialog states
	let isCreateOpen = $state(false);
	let createForm = $state({
		username: '',
		password: '',
		role: 'AdminOPD' as 'Admin' | 'AdminOPD',
		kodeUnor: ''
	});
	let isCreating = $state(false);

	// Edit dialog states
	let isEditOpen = $state(false);
	let editingUser = $state<UserItem | null>(null);
	let editForm = $state({
		username: '',
		password: '',
		role: 'AdminOPD' as 'Admin' | 'AdminOPD',
		kodeUnor: ''
	});
	let isUpdating = $state(false);

	// Delete dialog states
	let isDeleteOpen = $state(false);
	let deletingUser = $state<UserItem | null>(null);
	let isDeleting = $state(false);

	async function loadUsers() {
		isLoading = true;
		const res = await fetchUsers();
		isLoading = false;
		if (res.success && Array.isArray(res.data)) {
			users = res.data;
		} else {
			alertMessage = {
				type: 'destructive',
				title: 'Gagal Memuat Pengguna',
				desc: res.message || 'Tidak dapat mengambil data pengguna dari server.'
			};
		}
	}

	async function loadUnorList() {
		isLoadingUnor = true;
		const res = await fetchUnorList();
		isLoadingUnor = false;
		if (res.success && Array.isArray(res.data)) {
			unorList = res.data;
		}
	}

	onMount(() => {
		if (authState.isInitialized && !authState.isAdmin) {
			goto('/');
			return;
		}
		loadUsers();
		loadUnorList();
	});

	$effect(() => {
		if (authState.isInitialized && !authState.isAdmin) {
			goto('/');
		}
	});

	const filteredUsers = $derived(
		users.filter((u) => {
			const q = searchQuery.toLowerCase();
			return (
				u.username.toLowerCase().includes(q) ||
				(u.kodeUnor && u.kodeUnor.toLowerCase().includes(q)) ||
				u.role.toLowerCase().includes(q)
			);
		})
	);

	function openCreateDialog() {
		createForm = {
			username: '',
			password: '',
			role: 'AdminOPD',
			kodeUnor: unorList[0]?.kodeUnor || ''
		};
		isCreateOpen = true;
	}

	async function handleCreateUser(e: SubmitEvent) {
		e.preventDefault();
		if (!createForm.username || !createForm.password) return;
		isCreating = true;
		const res = await createUser({
			username: createForm.username,
			password: createForm.password,
			role: createForm.role,
			kodeUnor: createForm.role === 'AdminOPD' ? createForm.kodeUnor || null : null
		});
		isCreating = false;

		if (res.success) {
			isCreateOpen = false;
			alertMessage = {
				type: 'success',
				title: 'Berhasil',
				desc: `Akun "${createForm.username}" berhasil dibuat.`
			};
			loadUsers();
		} else {
			alertMessage = {
				type: 'destructive',
				title: 'Gagal Membuat Akun',
				desc: res.message || 'Terjadi kesalahan saat menyimpan user.'
			};
		}
	}

	function openEditDialog(u: UserItem) {
		editingUser = u;
		editForm = {
			username: u.username,
			password: '',
			role: u.role,
			kodeUnor: u.kodeUnor || ''
		};
		isEditOpen = true;
	}

	async function handleUpdateUser(e: SubmitEvent) {
		e.preventDefault();
		if (!editingUser) return;
		isUpdating = true;
		const payload: any = {
			username: editForm.username,
			role: editForm.role,
			kodeUnor: editForm.role === 'AdminOPD' ? editForm.kodeUnor || null : null
		};
		if (editForm.password && editForm.password.trim() !== '') {
			payload.password = editForm.password;
		}

		const res = await updateUser(editingUser.id, payload);
		isUpdating = false;

		if (res.success) {
			isEditOpen = false;
			alertMessage = {
				type: 'success',
				title: 'Berhasil Diperbarui',
				desc: `Akun "${editForm.username}" berhasil diperbarui.`
			};
			loadUsers();
		} else {
			alertMessage = {
				type: 'destructive',
				title: 'Gagal Memperbarui Akun',
				desc: res.message || 'Terjadi kesalahan saat mengedit user.'
			};
		}
	}

	function openDeleteDialog(u: UserItem) {
		deletingUser = u;
		isDeleteOpen = true;
	}

	async function handleDeleteUser() {
		if (!deletingUser) return;
		isDeleting = true;
		const res = await deleteUser(deletingUser.id);
		isDeleting = false;
		isDeleteOpen = false;

		if (res.success) {
			alertMessage = {
				type: 'success',
				title: 'Pengguna Dihapus',
				desc: `Akun "${deletingUser.username}" berhasil dihapus.`
			};
			loadUsers();
		} else {
			alertMessage = {
				type: 'destructive',
				title: 'Gagal Menghapus',
				desc: res.message || 'Terjadi kesalahan saat menghapus user.'
			};
		}
	}
</script>

<svelte:head>
	<title>Manajemen Akun Pengguna - ASN-Sync</title>
</svelte:head>

<div class="space-y-6 max-w-6xl mx-auto">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Manajemen Akun Pengguna</h2>
			<p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
				Kelola akun administrator pusat dan administrator OPD berserta penugasan kode UNOR.
			</p>
		</div>

		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				class="gap-1.5 text-xs"
				onclick={loadUsers}
				disabled={isLoading}
			>
				<RefreshCw class={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
				<span>Muat Ulang</span>
			</Button>

			<Button
				class="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 shadow-sm"
				size="sm"
				onclick={openCreateDialog}
			>
				<UserPlus class="h-3.5 w-3.5" />
				<span>Tambah Pengguna</span>
			</Button>
		</div>
	</div>

	{#if alertMessage}
		<Alert variant={alertMessage.type} class="py-3">
			{#if alertMessage.type === 'success'}
				<CheckCircle2 class="h-4 w-4" />
			{:else}
				<AlertCircle class="h-4 w-4" />
			{/if}
			<AlertTitle class="text-sm font-semibold">{alertMessage.title}</AlertTitle>
			<AlertDescription class="text-xs">{alertMessage.desc}</AlertDescription>
		</Alert>
	{/if}

	<!-- Search & Table Card -->
	<Card class="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
		<CardHeader class="pb-3">
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				<CardTitle class="text-base font-semibold text-slate-900 dark:text-white">
					Daftar Pengguna ({filteredUsers.length})
				</CardTitle>
				<div class="relative w-full sm:w-64">
					<Search class="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
					<Input
						type="text"
						placeholder="Cari username / UNOR..."
						class="pl-9 h-9 text-xs"
						bind:value={searchQuery}
					/>
				</div>
			</div>
		</CardHeader>

		<CardContent>
			<Table>
				<TableHeader>
					<TableRow class="hover:bg-transparent border-b border-slate-200 dark:border-slate-800">
						<TableHead class="w-16">ID</TableHead>
						<TableHead>Username</TableHead>
						<TableHead>Role</TableHead>
						<TableHead>Kode UNOR</TableHead>
						<TableHead>Dibuat Pada</TableHead>
						<TableHead class="text-right">Aksi</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if isLoading && users.length === 0}
						<TableRow class="border-b border-slate-100 dark:border-slate-800/60">
							<TableCell class="text-center py-8 text-slate-500 text-xs" colspan={6}>
								<Loader2 class="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-400" />
								<span>Memuat data pengguna...</span>
							</TableCell>
						</TableRow>
					{:else if filteredUsers.length === 0}
						<TableRow class="border-b border-slate-100 dark:border-slate-800/60">
							<TableCell class="text-center py-8 text-slate-500 text-xs" colspan={6}>
								Tidak ada data pengguna yang sesuai.
							</TableCell>
						</TableRow>
					{:else}
						{#each filteredUsers as u}
							<TableRow class="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
								<TableCell class="font-mono text-xs text-slate-400">#{u.id}</TableCell>
								<TableCell class="font-medium text-slate-900 dark:text-white">
									<div class="flex items-center gap-2">
										<div class="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
											{u.username.slice(0, 2).toUpperCase()}
										</div>
										<span>{u.username}</span>
									</div>
								</TableCell>
								<TableCell>
									<Badge variant={u.role === 'Admin' ? 'default' : 'secondary'} class="text-[11px]">
										{u.role === 'Admin' ? 'Admin Pusat' : 'Admin OPD'}
									</Badge>
								</TableCell>
								<TableCell>
									{#if u.kodeUnor}
										{@const found = unorList.find((un) => un.kodeUnor === u.kodeUnor)}
										<div class="flex flex-col">
											<span class="text-xs font-medium text-slate-800 dark:text-slate-200">
												{found ? found.namaUnor : u.kodeUnor}
											</span>
											<span class="font-mono text-[10px] text-slate-500">
												{u.kodeUnor}
											</span>
										</div>
									{:else}
										<span class="text-xs text-slate-500 italic">Semua / None</span>
									{/if}
								</TableCell>
								<TableCell class="text-xs text-slate-500 dark:text-slate-400">
									{new Date(u.createdAt).toLocaleDateString('id-ID', {
										day: 'numeric',
										month: 'short',
										year: 'numeric'
									})}
								</TableCell>
								<TableCell class="text-right">
									<div class="flex items-center justify-end gap-1">
										<Button
											variant="ghost"
											size="sm"
											class="h-8 w-8 p-0 text-slate-400 hover:text-slate-900 dark:hover:text-white"
											onclick={() => openEditDialog(u)}
											title="Edit User"
										>
											<Pencil class="h-3.5 w-3.5" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											class="h-8 w-8 p-0 text-slate-400 hover:text-rose-400"
											onclick={() => openDeleteDialog(u)}
											title="Hapus User"
										>
											<Trash2 class="h-3.5 w-3.5" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</CardContent>
	</Card>
</div>

<!-- Dialog Tambah User -->
<Dialog
	bind:open={isCreateOpen}
	title="Tambah Pengguna Baru"
	description="Buat akun baru untuk administrator pusat atau administrator OPD."
>
	{#snippet children()}
		<form id="create-form" onsubmit={handleCreateUser} class="space-y-4">
			<div class="space-y-1.5">
				<Label for="c-username" class="text-xs">Username</Label>
				<Input
					id="c-username"
					type="text"
					placeholder="cth: admin_bappeda"
					bind:value={createForm.username}
					required
					minlength={3}
					disabled={isCreating}
				/>
			</div>

			<div class="space-y-1.5">
				<Label for="c-password" class="text-xs">Password Awal (Min. 6 Karakter)</Label>
				<Input
					id="c-password"
					type="password"
					placeholder="Minimal 6 karakter"
					bind:value={createForm.password}
					required
					minlength={6}
					disabled={isCreating}
				/>
			</div>

			<div class="space-y-1.5">
				<Label for="c-role" class="text-xs">Role / Hak Akses</Label>
				<select
					id="c-role"
					class="flex h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
					bind:value={createForm.role}
					disabled={isCreating}
				>
					<option value="AdminOPD">Admin OPD (Dibatasi per Unit Organisasi)</option>
					<option value="Admin">Admin Pusat (Akses Penuh)</option>
				</select>
			</div>

			{#if createForm.role === 'AdminOPD'}
				<div class="space-y-1.5">
					<Label for="c-kodeUnor" class="text-xs">Unit Organisasi (UNOR)</Label>
					<select
						id="c-kodeUnor"
						class="flex h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
						bind:value={createForm.kodeUnor}
						required
						disabled={isCreating || isLoadingUnor}
					>
						<option value="" disabled>-- Pilih Unit Organisasi --</option>
						{#each unorList as u}
							<option value={u.kodeUnor}>
								{u.namaUnor} ({u.kodeUnor})
							</option>
						{/each}
					</select>
					<p class="text-[11px] text-slate-400">
						Akun AdminOPD akan difilter hanya dapat mengakses data dengan unit organisasi ini.
					</p>
				</div>
			{/if}
		</form>
	{/snippet}

	{#snippet footer()}
		<Button
			variant="outline"
			size="sm"
			onclick={() => (isCreateOpen = false)}
			disabled={isCreating}
		>
			Batal
		</Button>
		<Button
			type="submit"
			form="create-form"
			size="sm"
			class="bg-indigo-600 hover:bg-indigo-500"
			disabled={isCreating}
		>
			{#if isCreating}
				<Loader2 class="h-3.5 w-3.5 animate-spin" />
				<span>Menyimpan...</span>
			{:else}
				<span>Simpan Pengguna</span>
			{/if}
		</Button>
	{/snippet}
</Dialog>

<!-- Dialog Edit User -->
<Dialog
	bind:open={isEditOpen}
	title="Edit Pengguna"
	description="Perbarui informasi role, kode unit organisasi, atau set ulang password."
>
	{#snippet children()}
		<form id="edit-form" onsubmit={handleUpdateUser} class="space-y-4">
			<div class="space-y-1.5">
				<Label for="e-username" class="text-xs">Username</Label>
				<Input
					id="e-username"
					type="text"
					bind:value={editForm.username}
					required
					minlength={3}
					disabled={isUpdating}
				/>
			</div>

			<div class="space-y-1.5">
				<Label for="e-password" class="text-xs">
					Ganti Password Baru <span class="text-slate-500 font-normal">(Kosongkan jika tidak ingin mengubah)</span>
				</Label>
				<Input
					id="e-password"
					type="password"
					placeholder="Minimal 6 karakter baru"
					bind:value={editForm.password}
					minlength={6}
					disabled={isUpdating}
				/>
			</div>

			<div class="space-y-1.5">
				<Label for="e-role" class="text-xs">Role / Hak Akses</Label>
				<select
					id="e-role"
					class="flex h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
					bind:value={editForm.role}
					disabled={isUpdating}
				>
					<option value="AdminOPD">Admin OPD</option>
					<option value="Admin">Admin Pusat</option>
				</select>
			</div>

			{#if editForm.role === 'AdminOPD'}
				<div class="space-y-1.5">
					<Label for="e-kodeUnor" class="text-xs">Unit Organisasi (UNOR)</Label>
					<select
						id="e-kodeUnor"
						class="flex h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
						bind:value={editForm.kodeUnor}
						required
						disabled={isUpdating || isLoadingUnor}
					>
						<option value="" disabled>-- Pilih Unit Organisasi --</option>
						{#each unorList as u}
							<option value={u.kodeUnor}>
								{u.namaUnor} ({u.kodeUnor})
							</option>
						{/each}
					</select>
				</div>
			{/if}
		</form>
	{/snippet}

	{#snippet footer()}
		<Button
			variant="outline"
			size="sm"
			onclick={() => (isEditOpen = false)}
			disabled={isUpdating}
		>
			Batal
		</Button>
		<Button
			type="submit"
			form="edit-form"
			size="sm"
			class="bg-indigo-600 hover:bg-indigo-500"
			disabled={isUpdating}
		>
			{#if isUpdating}
				<Loader2 class="h-3.5 w-3.5 animate-spin" />
				<span>Memperbarui...</span>
			{:else}
				<span>Simpan Perubahan</span>
			{/if}
		</Button>
	{/snippet}
</Dialog>

<!-- Dialog Konfirmasi Hapus User -->
<Dialog
	bind:open={isDeleteOpen}
	title="Konfirmasi Hapus Pengguna"
	description="Tindakan ini tidak dapat dibatalkan. Pengguna tidak akan dapat mengakses sistem kembali."
>
	{#snippet children()}
		{#if deletingUser}
			<div class="rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-4 text-xs text-rose-800 dark:text-rose-300">
				Apakah Anda yakin ingin menghapus akun pengguna
				<span class="font-bold text-slate-900 dark:text-white font-mono">@{deletingUser.username}</span>?
			</div>
		{/if}
	{/snippet}

	{#snippet footer()}
		<Button
			variant="outline"
			size="sm"
			onclick={() => (isDeleteOpen = false)}
			disabled={isDeleting}
		>
			Batal
		</Button>
		<Button
			variant="destructive"
			size="sm"
			onclick={handleDeleteUser}
			disabled={isDeleting}
		>
			{#if isDeleting}
				<Loader2 class="h-3.5 w-3.5 animate-spin" />
				<span>Menghapus...</span>
			{:else}
				<span>Hapus Pengguna</span>
			{/if}
		</Button>
	{/snippet}
</Dialog>
