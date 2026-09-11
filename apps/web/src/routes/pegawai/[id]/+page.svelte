<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { authState } from '$lib/stores/auth.svelte';
	import {
		fetchPegawaiDetail,
		deletePegawai,
		type PegawaiItem
	} from '$lib/api/pegawai';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card';
	import { Dialog } from '$lib/components/ui/dialog';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert';
	import {
		ArrowLeft,
		Briefcase,
		Building2,
		ShieldAlert,
		Trash2,
		Pencil,
		IdCard,
		CheckCircle2,
		AlertCircle,
		Loader2,
		Calendar,
		UserCheck
	} from 'lucide-svelte';

	const employeeId = page.params.id;

	let pegawai = $state<PegawaiItem | null>(null);
	let isLoading = $state(true);
	let errorMessage = $state('');
	let isForbidden = $state(false);
	let isDeleteOpen = $state(false);
	let isDeleting = $state(false);

	async function loadDetail() {
		isLoading = true;
		errorMessage = '';
		isForbidden = false;

		const res = await fetchPegawaiDetail(employeeId);
		isLoading = false;

		if (res.success && res.data) {
			pegawai = res.data;
		} else {
			if (res.message?.includes('Forbidden') || res.message?.includes('hak akses')) {
				isForbidden = true;
				errorMessage = 'Akses Ditolak: Anda tidak memiliki wewenang untuk melihat data pegawai dari Unit Organisasi lain.';
			} else {
				errorMessage = res.message || 'Data pegawai tidak ditemukan.';
			}
		}
	}

	onMount(() => {
		loadDetail();
	});

	async function handleDelete() {
		if (!pegawai) return;
		isDeleting = true;
		const res = await deletePegawai(pegawai.id);
		isDeleting = false;
		if (res.success) {
			goto('/pegawai');
		} else {
			errorMessage = res.message || 'Gagal menghapus data pegawai.';
			isDeleteOpen = false;
		}
	}
</script>

<svelte:head>
	<title>Detail Pegawai {pegawai?.nama ? `- ${pegawai.nama}` : ''} - Usul Data</title>
</svelte:head>

<div class="space-y-6 max-w-4xl mx-auto">
	<!-- Top Navigation -->
	<div class="flex items-center justify-between">
		<Button
			href="/pegawai"
			variant="outline"
			size="sm"
			class="gap-1.5 text-xs h-9 text-slate-300 hover:text-white"
		>
			<ArrowLeft class="h-4 w-4" />
			<span>Kembali ke Daftar Pegawai</span>
		</Button>

		{#if pegawai}
			<div class="flex items-center gap-2">
				<Button
					variant="destructive"
					size="sm"
					class="gap-1.5 text-xs h-9"
					onclick={() => isDeleteOpen = true}
				>
					<Trash2 class="h-3.5 w-3.5" />
					<span>Hapus Pegawai</span>
				</Button>
			</div>
		{/if}
	</div>

	{#if isLoading}
		<Card class="border-slate-800 bg-slate-900/40 py-16">
			<div class="flex flex-col items-center justify-center text-slate-400 gap-2">
				<Loader2 class="h-7 w-7 animate-spin text-indigo-400" />
				<span class="text-xs">Memuat detail data pegawai...</span>
			</div>
		</Card>
	{:else if isForbidden}
		<Card class="border-rose-900/50 bg-rose-950/20 p-8 text-center space-y-4">
			<div class="flex h-12 w-12 items-center justify-center rounded-full bg-rose-950 border border-rose-800 mx-auto text-rose-400">
				<ShieldAlert class="h-6 w-6" />
			</div>
			<div class="space-y-1">
				<h2 class="text-lg font-bold text-white">403 - Akses Ditolak (Scoping Restricted)</h2>
				<p class="text-xs text-rose-300 max-w-md mx-auto leading-relaxed">
					{errorMessage}
				</p>
			</div>
			<div>
				<Button href="/pegawai" variant="secondary" size="sm" class="text-xs">
					Kembali ke Daftar Unit Organisasi Anda
				</Button>
			</div>
		</Card>
	{:else if errorMessage || !pegawai}
		<Card class="border-slate-800 bg-slate-900/40 p-8 text-center space-y-4">
			<div class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 border border-slate-700 mx-auto text-slate-400">
				<AlertCircle class="h-6 w-6" />
			</div>
			<div class="space-y-1">
				<h2 class="text-base font-semibold text-white">Data Tidak Ditemukan</h2>
				<p class="text-xs text-slate-400 max-w-sm mx-auto">
					{errorMessage || 'Pegawai dengan ID yang diminta tidak terdaftar pada sistem.'}
				</p>
			</div>
			<div>
				<Button href="/pegawai" variant="outline" size="sm" class="text-xs">
					Kembali ke Daftar Pegawai
				</Button>
			</div>
		</Card>
	{:else}
		<!-- Main Profile Header Card -->
		<Card class="border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 overflow-hidden">
			<CardContent class="p-6 md:p-8">
				<div class="flex flex-col md:flex-row md:items-center gap-6">
					<!-- Large Avatar Letter -->
					<div class="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-indigo-600/20 border-2 border-indigo-500/40 text-indigo-400 font-extrabold text-3xl shadow-inner">
						{pegawai.nama.charAt(0).toUpperCase()}
					</div>

					<div class="space-y-2 flex-1">
						<div class="flex flex-wrap items-center gap-2">
							<Badge variant="default" class="text-xs">
								Aparatur Sipil Aktif
							</Badge>
							<Badge variant="outline" class="font-mono text-xs bg-slate-900 text-slate-300 border-slate-700">
								ID #{pegawai.id}
							</Badge>
						</div>

						<h1 class="text-2xl md:text-3xl font-bold text-white tracking-tight">
							{pegawai.nama}
						</h1>

						<p class="text-sm font-medium text-indigo-300">
							{pegawai.jabatan}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Details Information Sections -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
			<!-- Identitas Pegawai Card -->
			<Card class="border-slate-800 bg-slate-900/60">
				<CardHeader class="pb-3 border-b border-slate-800/80">
					<CardTitle class="text-sm font-semibold text-white flex items-center gap-2">
						<IdCard class="h-4 w-4 text-indigo-400" />
						<span>Identitas Pegawai</span>
					</CardTitle>
					<CardDescription class="text-xs">Nomor identitas dan data administratif.</CardDescription>
				</CardHeader>
				<CardContent class="pt-4 space-y-4 text-xs">
					<div class="flex items-center justify-between py-1 border-b border-slate-800/40">
						<span class="text-slate-400">Nomor Induk Pegawai (NIP):</span>
						<span class="font-mono font-semibold text-white">{pegawai.nip}</span>
					</div>
					<div class="flex items-center justify-between py-1 border-b border-slate-800/40">
						<span class="text-slate-400">Nama Lengkap:</span>
						<span class="font-medium text-slate-200">{pegawai.nama}</span>
					</div>
					<div class="flex items-center justify-between py-1 border-b border-slate-800/40">
						<span class="text-slate-400">Jabatan:</span>
						<span class="font-medium text-slate-200">{pegawai.jabatan}</span>
					</div>
					<div class="flex items-center justify-between py-1">
						<span class="text-slate-400">Status Verifikasi:</span>
						<span class="inline-flex items-center gap-1 font-semibold text-emerald-400">
							<CheckCircle2 class="h-3.5 w-3.5" />
							<span>Terverifikasi</span>
						</span>
					</div>
				</CardContent>
			</Card>

			<!-- Unit Organisasi Card -->
			<Card class="border-slate-800 bg-slate-900/60">
				<CardHeader class="pb-3 border-b border-slate-800/80">
					<CardTitle class="text-sm font-semibold text-white flex items-center gap-2">
						<Building2 class="h-4 w-4 text-emerald-400" />
						<span>Penempatan Unit Organisasi</span>
					</CardTitle>
					<CardDescription class="text-xs">Satuan kerja penugasan pegawai (UNOR).</CardDescription>
				</CardHeader>
				<CardContent class="pt-4 space-y-4 text-xs">
					<div class="flex items-center justify-between py-1 border-b border-slate-800/40">
						<span class="text-slate-400">Satuan Kerja / UNOR:</span>
						<span class="font-semibold text-white text-right">
							{pegawai.namaUnor || 'Unit Organisasi'}
						</span>
					</div>
					<div class="flex items-center justify-between py-1 border-b border-slate-800/40">
						<span class="text-slate-400">Wewenang Akses:</span>
						<span class="text-slate-300">
							{authState.isAdmin ? 'Akses Pusat (Penuh)' : 'Terkunci pada OPD Anda'}
						</span>
					</div>
					{#if authState.isAdmin}
						<div class="flex items-center justify-between py-1">
							<span class="text-slate-400">Tautan Master:</span>
							<a href="/unor" class="text-indigo-400 hover:text-indigo-300 font-medium">
								Lihat Daftar Satuan Kerja →
							</a>
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>
	{/if}
</div>

<!-- Dialog Konfirmasi Hapus -->
<Dialog
	bind:open={isDeleteOpen}
	title="Hapus Data Pegawai"
	description="Konfirmasi penghapusan data aparatur sipil."
	onclose={() => isDeleteOpen = false}
>
	<div class="space-y-4">
		<p class="text-xs text-slate-300">
			Apakah Anda yakin ingin menghapus data pegawai
			<span class="font-semibold text-white">{pegawai?.nama}</span>
			(NIP: <span class="font-mono text-indigo-400">{pegawai?.nip}</span>)?
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
				onclick={handleDelete}
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
