<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authState } from '$lib/stores/auth.svelte';
	import {
		fetchUsulanList,
		fetchUsulanDetail,
		approveUsulan,
		rejectUsulan,
		type UsulanItem,
		type UsulanStatus,
		type KategoriUbah
	} from '$lib/api/usulan';
	import { fetchUnorList, type UnorItem } from '$lib/api/pegawai';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card';
	import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Dialog } from '$lib/components/ui/dialog';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		CheckCheck,
		CheckCircle2,
		XCircle,
		Clock,
		AlertCircle,
		Filter,
		RefreshCw,
		Building2,
		Search,
		ExternalLink,
		FileText,
		User,
		Briefcase,
		ShieldCheck,
		ChevronLeft,
		ChevronRight,
		Loader2,
		MessageSquare,
		Calendar
	} from 'lucide-svelte';

	let usulanList = $state<UsulanItem[]>([]);
	let unorList = $state<UnorItem[]>([]);
	let isLoading = $state(false);

	// Filters
	let selectedUnor = $state<string>('');
	let selectedStatus = $state<string>('diajukan'); // Default to 'diajukan' for queue triage
	let selectedKategori = $state<string>('all');
	let searchQuery = $state<string>('');

	// Pagination
	let currentPage = $state(1);
	const itemsPerPage = 10;

	// Feedback Alert
	let alertMessage = $state<{
		type: 'success' | 'destructive';
		title: string;
		desc: string;
	} | null>(null);

	// Detail Modal states
	let isDetailOpen = $state(false);
	let detailLoading = $state(false);
	let currentDetail = $state<UsulanItem | null>(null);

	// Approval Modal states
	let isApproveOpen = $state(false);
	let approveCatatan = $state('');
	let isApproving = $state(false);

	// Rejection Modal states
	let isRejectOpen = $state(false);
	let rejectCatatan = $state('');
	let rejectError = $state<string | null>(null);
	let isRejecting = $state(false);

	const kategoriList: KategoriUbah[] = [
		'Data Pribadi',
		'Data Keluarga',
		'Golongan',
		'Jabatan',
		'Pendidikan',
		'Pindah Instansi',
		'Diklat/Kursus'
	];

	// Derived statistics
	const totalDiajukan = $derived(usulanList.filter((u) => u.status === 'diajukan').length);
	const totalDisetujui = $derived(usulanList.filter((u) => u.status === 'disetujui').length);
	const totalDitolak = $derived(usulanList.filter((u) => u.status === 'ditolak').length);

	// Filtered list by search query (Client side filter for nama/NIP)
	const filteredList = $derived(
		usulanList.filter((item) => {
			if (!searchQuery.trim()) return true;
			const query = searchQuery.toLowerCase().trim();
			const namaMatch = item.namaPegawai?.toLowerCase().includes(query) ?? false;
			const nipMatch = item.nipPegawai?.toLowerCase().includes(query) ?? false;
			const nomorMatch = `#${item.id}`.includes(query);
			return namaMatch || nipMatch || nomorMatch;
		})
	);

	const totalPages = $derived(Math.max(1, Math.ceil(filteredList.length / itemsPerPage)));

	const paginatedList = $derived(
		filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);

	function formatWibDate(dateString?: string | null): string {
		if (!dateString) return '-';
		try {
			const date = new Date(dateString);
			return new Intl.DateTimeFormat('id-ID', {
				day: 'numeric',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				timeZone: 'Asia/Jakarta'
			}).format(date) + ' WIB';
		} catch {
			return dateString;
		}
	}

	function getStatusBadge(status: UsulanStatus) {
		switch (status) {
			case 'draft':
				return { label: 'Draft', class: 'bg-slate-800 text-slate-300 border-slate-700' };
			case 'diajukan':
				return { label: 'Menunggu Verifikasi', class: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
			case 'disetujui':
				return { label: 'Disetujui', class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
			case 'ditolak':
				return { label: 'Ditolak', class: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
			case 'dibatalkan':
				return { label: 'Dibatalkan', class: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
			default:
				return { label: status, class: 'bg-slate-800 text-slate-300 border-slate-700' };
		}
	}

	async function loadUnors() {
		const res = await fetchUnorList();
		if (res.success && Array.isArray(res.data)) {
			unorList = res.data;
		}
	}

	async function loadUsulan() {
		isLoading = true;
		currentPage = 1;
		const params: { kode_unor?: string; status?: string; kategori_ubah?: string } = {};
		if (selectedUnor) params.kode_unor = selectedUnor;
		if (selectedStatus && selectedStatus !== 'all') params.status = selectedStatus;
		if (selectedKategori && selectedKategori !== 'all') params.kategori_ubah = selectedKategori;

		const res = await fetchUsulanList(params);
		isLoading = false;
		if (res.success && Array.isArray(res.data)) {
			usulanList = res.data;
		} else {
			alertMessage = {
				type: 'destructive',
				title: 'Gagal Memuat Antrean Usulan',
				desc: res.message || 'Tidak dapat mengambil daftar usulan verifikasi.'
			};
		}
	}

	async function openDetail(id: number) {
		isDetailOpen = true;
		detailLoading = true;
		currentDetail = null;

		const res = await fetchUsulanDetail(id);
		detailLoading = false;
		if (res.success && res.data) {
			currentDetail = res.data;
		} else {
			alertMessage = {
				type: 'destructive',
				title: 'Gagal Memuat Detail',
				desc: res.message || 'Tidak dapat memuat detail usulan.'
			};
			isDetailOpen = false;
		}
	}

	function confirmApprove() {
		approveCatatan = '';
		isApproveOpen = true;
	}

	async function handleApprove() {
		if (!currentDetail) return;
		isApproving = true;
		alertMessage = null;

		const res = await approveUsulan(currentDetail.id, approveCatatan);
		isApproving = false;
		isApproveOpen = false;

		if (res.success) {
			alertMessage = {
				type: 'success',
				title: 'Usulan Disetujui',
				desc: res.message || 'Usulan perubahan data telah berhasil disetujui dan data master pegawai diperbarui.'
			};
			await loadUsulan();
			// Refresh detail modal
			await openDetail(currentDetail.id);
		} else {
			alertMessage = {
				type: 'destructive',
				title: 'Gagal Menyetujui Usulan',
				desc: res.message || 'Terjadi kesalahan saat menyetujui usulan.'
			};
		}
	}

	function confirmReject() {
		rejectCatatan = '';
		rejectError = null;
		isRejectOpen = true;
	}

	async function handleReject() {
		if (!currentDetail) return;
		if (!rejectCatatan.trim()) {
			rejectError = 'Harap isi alasan / catatan penolakan.';
			return;
		}

		isRejecting = true;
		rejectError = null;
		alertMessage = null;

		const res = await rejectUsulan(currentDetail.id, rejectCatatan.trim());
		isRejecting = false;
		isRejectOpen = false;

		if (res.success) {
			alertMessage = {
				type: 'success',
				title: 'Usulan Ditolak',
				desc: res.message || 'Usulan berhasil ditolak dengan catatan alasan yang tersimpan.'
			};
			await loadUsulan();
			// Refresh detail modal
			await openDetail(currentDetail.id);
		} else {
			alertMessage = {
				type: 'destructive',
				title: 'Gagal Menolak Usulan',
				desc: res.message || 'Terjadi kesalahan saat menolak usulan.'
			};
		}
	}

	onMount(async () => {
		if (authState.isInitialized && !authState.isAdmin) {
			goto('/usulan');
			return;
		}
		await Promise.all([loadUnors(), loadUsulan()]);
	});
</script>

<svelte:head>
	<title>Dashboard Verifikasi Usulan - Admin Pusat</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div>
			<div class="flex items-center gap-2">
				<h1 class="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
					<ShieldCheck class="h-6 w-6 text-indigo-400" />
					Verifikasi Usulan Data
				</h1>
				<Badge class="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">Admin Pusat</Badge>
			</div>
			<p class="text-sm text-slate-400 mt-1">
				Antrean verifikasi usulan perubahan data pegawai dari seluruh Unit Organisasi (OPD).
			</p>
		</div>

		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				class="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
				onclick={loadUsulan}
				disabled={isLoading}
			>
				<RefreshCw class={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
				Segarkan Data
			</Button>
		</div>
	</div>

	<!-- Alert Notification -->
	{#if alertMessage}
		<Alert
			variant={alertMessage.type === 'destructive' ? 'destructive' : 'default'}
			class={alertMessage.type === 'success'
				? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
				: 'bg-rose-950/40 border-rose-800/60 text-rose-300'}
		>
			<AlertTitle class="font-semibold">{alertMessage.title}</AlertTitle>
			<AlertDescription>{alertMessage.desc}</AlertDescription>
		</Alert>
	{/if}

	<!-- Statistics Counters -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<Card class="border-slate-800 bg-slate-900/60 shadow-sm">
			<CardContent class="p-5 flex items-center justify-between">
				<div>
					<p class="text-xs font-medium uppercase tracking-wider text-amber-400">Menunggu Verifikasi</p>
					<h3 class="text-2xl font-black text-white mt-1">{totalDiajukan}</h3>
					<p class="text-xs text-slate-400 mt-0.5">Membutuhkan persetujuan Admin</p>
				</div>
				<div class="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
					<Clock class="h-6 w-6" />
				</div>
			</CardContent>
		</Card>

		<Card class="border-slate-800 bg-slate-900/60 shadow-sm">
			<CardContent class="p-5 flex items-center justify-between">
				<div>
					<p class="text-xs font-medium uppercase tracking-wider text-emerald-400">Total Disetujui</p>
					<h3 class="text-2xl font-black text-white mt-1">{totalDisetujui}</h3>
					<p class="text-xs text-slate-400 mt-0.5">Data master telah diperbarui</p>
				</div>
				<div class="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
					<CheckCircle2 class="h-6 w-6" />
				</div>
			</CardContent>
		</Card>

		<Card class="border-slate-800 bg-slate-900/60 shadow-sm">
			<CardContent class="p-5 flex items-center justify-between">
				<div>
					<p class="text-xs font-medium uppercase tracking-wider text-rose-400">Total Ditolak</p>
					<h3 class="text-2xl font-black text-white mt-1">{totalDitolak}</h3>
					<p class="text-xs text-slate-400 mt-0.5">Ditolak dengan alasan audit</p>
				</div>
				<div class="h-12 w-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
					<XCircle class="h-6 w-6" />
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Filter & Search Section -->
	<Card class="border-slate-800 bg-slate-900/40">
		<CardContent class="p-4 space-y-4">
			<div class="grid grid-cols-1 gap-3 md:grid-cols-4">
				<!-- Search -->
				<div>
					<Label class="text-xs text-slate-400 mb-1.5 block">Cari Pegawai / NIP</Label>
					<div class="relative">
						<Search class="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
						<Input
							type="text"
							placeholder="Nama atau NIP..."
							bind:value={searchQuery}
							class="pl-9 bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-500"
						/>
					</div>
				</div>

				<!-- Filter Status -->
				<div>
					<Label class="text-xs text-slate-400 mb-1.5 block">Status Usulan</Label>
					<select
						bind:value={selectedStatus}
						onchange={loadUsulan}
						class="w-full h-10 rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
					>
						<option value="diajukan">Menunggu Verifikasi (Diajukan)</option>
						<option value="all">Semua Status</option>
						<option value="disetujui">Disetujui</option>
						<option value="ditolak">Ditolak</option>
						<option value="draft">Draft</option>
						<option value="dibatalkan">Dibatalkan</option>
					</select>
				</div>

				<!-- Filter Kategori -->
				<div>
					<Label class="text-xs text-slate-400 mb-1.5 block">Kategori Usulan</Label>
					<select
						bind:value={selectedKategori}
						onchange={loadUsulan}
						class="w-full h-10 rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
					>
						<option value="all">Semua Kategori</option>
						{#each kategoriList as kat}
							<option value={kat}>{kat}</option>
						{/each}
					</select>
				</div>

				<!-- Filter UNOR -->
				<div>
					<Label class="text-xs text-slate-400 mb-1.5 block">Unit Organisasi (UNOR)</Label>
					<select
						bind:value={selectedUnor}
						onchange={loadUsulan}
						class="w-full h-10 rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
					>
						<option value="">Semua Unit Organisasi</option>
						{#each unorList as u}
							<option value={u.kodeUnor}>{u.namaUnor} ({u.kodeUnor})</option>
						{/each}
					</select>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Table Usulan List -->
	<Card class="border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
		<CardContent class="p-0">
			{#if isLoading}
				<div class="flex flex-col items-center justify-center py-16 text-slate-400">
					<Loader2 class="h-8 w-8 animate-spin text-indigo-500 mb-3" />
					<p class="text-sm">Memuat daftar usulan verifikasi...</p>
				</div>
			{:else if paginatedList.length === 0}
				<div class="flex flex-col items-center justify-center py-16 px-4 text-center">
					<div class="h-12 w-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3">
						<CheckCheck class="h-6 w-6" />
					</div>
					<h3 class="text-base font-semibold text-white">Tidak Ada Usulan</h3>
					<p class="text-xs text-slate-400 max-w-sm mt-1">
						{selectedStatus === 'diajukan'
							? 'Hebat! Seluruh antrean usulan pada filter ini telah selesai diverifikasi.'
							: 'Tidak ditemukan data usulan yang sesuai dengan kriteria filter saat ini.'}
					</p>
				</div>
			{:else}
				<div class="overflow-x-auto">
					<Table>
						<TableHeader class="bg-slate-950/40">
							<TableRow class="border-slate-800 hover:bg-transparent">
								<TableHead class="text-slate-400 font-semibold text-xs py-3.5 w-14">No</TableHead>
								<TableHead class="text-slate-400 font-semibold text-xs py-3.5">Pegawai</TableHead>
								<TableHead class="text-slate-400 font-semibold text-xs py-3.5">Unit Organisasi</TableHead>
								<TableHead class="text-slate-400 font-semibold text-xs py-3.5">Tanggal Pengajuan</TableHead>
								<TableHead class="text-slate-400 font-semibold text-xs py-3.5">Status</TableHead>
								<TableHead class="text-slate-400 font-semibold text-xs py-3.5">Verifikator</TableHead>
								<TableHead class="text-right text-slate-400 font-semibold text-xs py-3.5">Aksi</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each paginatedList as item, idx}
								{@const badge = getStatusBadge(item.status)}
								<TableRow class="border-slate-800 hover:bg-slate-800/40 transition-colors">
									<TableCell class="text-xs font-mono text-slate-400">
										{(currentPage - 1) * itemsPerPage + idx + 1}
									</TableCell>
									<TableCell>
										<div class="font-medium text-white text-sm">
											{item.namaPegawai || 'Pegawai Terkait'}
										</div>
										<div class="text-xs text-slate-400 font-mono">
											NIP: {item.nipPegawai || '-'}
										</div>
									</TableCell>
									<TableCell class="text-xs text-slate-300">
										<div class="max-w-[220px] truncate" title={item.namaUnor || item.kodeUnor}>
											{item.namaUnor || item.kodeUnor}
										</div>
									</TableCell>
									<TableCell class="text-xs text-slate-300">
										{formatWibDate(item.createdAt)}
									</TableCell>
									<TableCell>
										<Badge class={`text-xs border ${badge.class}`}>
											{badge.label}
										</Badge>
									</TableCell>
									<TableCell class="text-xs text-slate-400">
										{#if item.verifiedBy}
											<div class="text-slate-200 font-medium">{item.verifiedBy}</div>
											<div class="text-[11px] text-slate-400">{formatWibDate(item.verifiedAt)}</div>
										{:else}
											<span class="text-slate-500">-</span>
										{/if}
									</TableCell>
									<TableCell class="text-right">
										<Button
											size="sm"
											variant={item.status === 'diajukan' ? 'default' : 'outline'}
											class={item.status === 'diajukan'
												? 'bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs'
												: 'border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 text-xs'}
											onclick={() => openDetail(item.id)}
										>
											{#if item.status === 'diajukan'}
												<CheckCheck class="h-3.5 w-3.5 mr-1.5" />
												Verifikasi
											{:else}
												Detail
											{/if}
										</Button>
									</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				</div>

				<!-- Pagination Controls -->
				{#if totalPages > 1}
					<div class="flex items-center justify-between border-t border-slate-800 px-4 py-3 bg-slate-950/20">
						<div class="text-xs text-slate-400">
							Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredList.length)} dari {filteredList.length} usulan
						</div>
						<div class="flex items-center gap-1.5">
							<Button
								variant="outline"
								size="sm"
								class="h-8 border-slate-800 bg-slate-900 text-slate-300"
								disabled={currentPage === 1}
								onclick={() => (currentPage = Math.max(1, currentPage - 1))}
							>
								<ChevronLeft class="h-4 w-4" />
							</Button>
							<span class="text-xs text-slate-300 px-2">
								{currentPage} / {totalPages}
							</span>
							<Button
								variant="outline"
								size="sm"
								class="h-8 border-slate-800 bg-slate-900 text-slate-300"
								disabled={currentPage === totalPages}
								onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
							>
								<ChevronRight class="h-4 w-4" />
							</Button>
						</div>
					</div>
				{/if}
			{/if}
		</CardContent>
	</Card>
</div>

<!-- Modal Detail & Verifikasi -->
<Dialog
	bind:open={isDetailOpen}
	onclose={() => {
		isDetailOpen = false;
		currentDetail = null;
	}}
	class="max-w-3xl max-h-[90vh] overflow-y-auto"
>
	<div class="p-6 space-y-6">
		{#if detailLoading || !currentDetail}
			<div class="flex flex-col items-center justify-center py-12 text-slate-400">
				<Loader2 class="h-8 w-8 animate-spin text-indigo-500 mb-2" />
				<p class="text-sm">Memuat rincian usulan...</p>
			</div>
		{:else}
			{@const badge = getStatusBadge(currentDetail.status)}
			<!-- Modal Header -->
			<div class="flex items-start justify-between border-b border-slate-800 pb-4">
				<div>
					<div class="flex items-center gap-2">
						<h2 class="text-lg font-bold text-white">Rincian Usulan</h2>
						<Badge class={`text-xs border ${badge.class}`}>
							{badge.label}
						</Badge>
					</div>
					<p class="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
						<Calendar class="h-3.5 w-3.5" />
						Diajukan pada {formatWibDate(currentDetail.createdAt)}
					</p>
				</div>
			</div>

			<!-- Pegawai Summary Card -->
			<div class="rounded-xl border border-slate-800 bg-slate-950/60 p-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div class="space-y-1">
					<span class="text-xs text-slate-400">Nama Pegawai</span>
					<div class="text-sm font-semibold text-white flex items-center gap-2">
						<User class="h-4 w-4 text-indigo-400" />
						{currentDetail.namaPegawai || '-'}
					</div>
					<div class="text-xs text-slate-400 font-mono">NIP: {currentDetail.nipPegawai || '-'}</div>
				</div>
				<div class="space-y-1">
					<span class="text-xs text-slate-400">Jabatan & Unit Kerja</span>
					<div class="text-sm text-slate-200 flex items-center gap-2">
						<Briefcase class="h-4 w-4 text-slate-400" />
						{currentDetail.jabatanPegawai || '-'}
					</div>
					<div class="text-xs text-slate-400 flex items-center gap-1.5">
						<Building2 class="h-3.5 w-3.5" />
						{currentDetail.namaUnor || currentDetail.kodeUnor}
					</div>
				</div>
			</div>

			<!-- Catatan Pengusul -->
			{#if currentDetail.catatan && currentDetail.status !== 'ditolak'}
				<div class="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3.5">
					<span class="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
						<MessageSquare class="h-3.5 w-3.5 text-slate-400" />
						Catatan Pengusul (OPD):
					</span>
					<p class="text-xs text-slate-200 leading-relaxed italic">
						"{currentDetail.catatan}"
					</p>
				</div>
			{/if}

			<!-- Rincian Field Perubahan -->
			<div class="space-y-2.5">
				<h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400">
					Komparasi Rincian Perubahan ({currentDetail.details?.length || 0} Field)
				</h3>

				<div class="rounded-lg border border-slate-800 overflow-hidden">
					<Table>
						<TableHeader class="bg-slate-950/60">
							<TableRow class="border-slate-800">
								<TableHead class="text-xs text-slate-400 py-2">Kategori</TableHead>
								<TableHead class="text-xs text-slate-400 py-2">Jenis</TableHead>
								<TableHead class="text-xs text-slate-400 py-2">Nama Field</TableHead>
								<TableHead class="text-xs text-slate-400 py-2">Nilai Lama</TableHead>
								<TableHead class="text-xs text-slate-400 py-2">Nilai Baru</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each currentDetail.details || [] as det}
								<TableRow class="border-slate-800/60 text-xs">
									<TableCell class="font-medium text-slate-200">
										{det.kategoriUbah}
									</TableCell>
									<TableCell>
										<span
											class={`px-2 py-0.5 rounded text-[11px] font-medium uppercase ${
												det.jenisUsulan === 'tambah'
													? 'bg-emerald-500/20 text-emerald-400'
													: det.jenisUsulan === 'ubah'
														? 'bg-blue-500/20 text-blue-400'
														: 'bg-rose-500/20 text-rose-400'
											}`}
										>
											{det.jenisUsulan}
										</span>
									</TableCell>
									<TableCell class="font-mono text-slate-300">
										{det.fieldName}
									</TableCell>
									<TableCell class="text-slate-400 max-w-[150px] truncate">
										{det.nilaiLama || '-'}
									</TableCell>
									<TableCell class="text-emerald-400 font-semibold max-w-[150px] truncate">
										{det.nilaiBaru || '-'}
									</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				</div>
			</div>

			<!-- Dokumen Pendukung -->
			<div class="space-y-2.5">
				<h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400">
					Dokumen Bukti Pendukung ({currentDetail.dokumen?.length || 0} Berkas)
				</h3>

				{#if !currentDetail.dokumen || currentDetail.dokumen.length === 0}
					<div class="rounded-lg border border-slate-800/60 bg-slate-950/40 p-4 text-center text-xs text-slate-500">
						Tidak ada dokumen bukti yang dilampirkan pada usulan ini.
					</div>
				{:else}
					<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
						{#each currentDetail.dokumen as doc}
							<div class="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-3">
								<div class="flex items-center gap-2.5 overflow-hidden pr-2">
									<div class="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
										<FileText class="h-4 w-4" />
									</div>
									<div class="overflow-hidden">
										<p class="text-xs font-medium text-slate-200 truncate" title={doc.namaDokumen}>
											{doc.namaDokumen}
										</p>
										<p class="text-[11px] text-slate-400">
											PDF ({Math.round((doc.ukuranBytes || 0) / 1024)} KB)
										</p>
									</div>
								</div>
								<!-- Preview Dokumen: Buka di Tab Baru sesuai spesifikasi -->
								<a
									href={doc.pathFile}
									target="_blank"
									rel="noopener noreferrer"
									class="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 shrink-0 px-2 py-1 rounded hover:bg-slate-800/60 transition-colors"
								>
									<span>Buka Dokumen</span>
									<ExternalLink class="h-3 w-3" />
								</a>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Audit Log Section -->
			{#if currentDetail.status === 'disetujui' || currentDetail.status === 'ditolak'}
				<div class="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
					<h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
						<ShieldCheck class="h-4 w-4 text-indigo-400" />
						Catatan Audit Verifikasi
					</h4>
					<div class="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
						<div>
							<span class="text-slate-400">Diverifikasi oleh:</span>
							<p class="font-medium text-white">{currentDetail.verifiedBy || '-'}</p>
						</div>
						<div>
							<span class="text-slate-400">Waktu Verifikasi:</span>
							<p class="font-medium text-white">{formatWibDate(currentDetail.verifiedAt)}</p>
						</div>
					</div>
					{#if currentDetail.catatan}
						<div class="pt-2 border-t border-slate-800/80">
							<span class="text-xs text-slate-400">
								{currentDetail.status === 'ditolak' ? 'Alasan Penolakan:' : 'Catatan Persetujuan:'}
							</span>
							<p class="text-xs text-slate-200 mt-0.5 bg-slate-950/40 p-2.5 rounded border border-slate-800/60">
								{currentDetail.catatan}
							</p>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Actions Footer -->
			<div class="flex items-center justify-between border-t border-slate-800 pt-4">
				<Button
					variant="outline"
					class="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white text-xs"
					onclick={() => (isDetailOpen = false)}
				>
					Tutup
				</Button>

				{#if currentDetail.status === 'diajukan'}
					<div class="flex items-center gap-2">
						<Button
							variant="outline"
							class="border-rose-800/60 bg-rose-950/20 text-rose-300 hover:bg-rose-900/40 hover:text-white text-xs"
							onclick={confirmReject}
						>
							<XCircle class="h-3.5 w-3.5 mr-1.5 text-rose-400" />
							Tolak Usulan
						</Button>
						<Button
							class="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm"
							onclick={confirmApprove}
						>
							<CheckCircle2 class="h-3.5 w-3.5 mr-1.5" />
							Setujui (Approve)
						</Button>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</Dialog>

<!-- Modal Konfirmasi Setujui (Approve) -->
<Dialog
	bind:open={isApproveOpen}
	onclose={() => {
		isApproveOpen = false;
	}}
	class="max-w-md"
>
	<div class="p-6 space-y-4">
		<div class="flex items-center gap-3">
			<div class="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
				<CheckCircle2 class="h-5 w-5" />
			</div>
			<div>
				<h3 class="text-base font-bold text-white">Setujui Usulan Perubahan?</h3>
				<p class="text-xs text-slate-400">Pegawai: {currentDetail?.namaPegawai}</p>
			</div>
		</div>

		<p class="text-xs text-slate-300 leading-relaxed">
			Dengan menyetujui usulan ini, status akan diubah menjadi <span class="text-emerald-400 font-semibold">Disetujui</span> dan rincian perubahan field akan <span class="underline">secara otomatis memicu pembaruan data master pegawai</span>.
		</p>

		<div class="space-y-1.5">
			<Label class="text-xs text-slate-400">Catatan Persetujuan (Opsional)</Label>
			<Input
				type="text"
				placeholder="Contoh: Berkas dan SK telah diverifikasi sah"
				bind:value={approveCatatan}
				class="bg-slate-950/60 border-slate-800 text-slate-100 text-xs"
			/>
		</div>

		<div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
			<Button
				variant="outline"
				class="border-slate-800 bg-slate-900 text-slate-300 text-xs"
				disabled={isApproving}
				onclick={() => (isApproveOpen = false)}
			>
				Batal
			</Button>
			<Button
				class="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs"
				disabled={isApproving}
				onclick={handleApprove}
			>
				{#if isApproving}
					<Loader2 class="h-3.5 w-3.5 mr-1.5 animate-spin" />
					Memproses...
				{:else}
					<CheckCircle2 class="h-3.5 w-3.5 mr-1.5" />
					Ya, Setujui Sekarang
				{/if}
			</Button>
		</div>
	</div>
</Dialog>

<!-- Modal Input Alasan Penolakan (Reject) -->
<Dialog
	bind:open={isRejectOpen}
	onclose={() => {
		isRejectOpen = false;
	}}
	class="max-w-md"
>
	<div class="p-6 space-y-4">
		<div class="flex items-center gap-3">
			<div class="h-10 w-10 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
				<XCircle class="h-5 w-5" />
			</div>
			<div>
				<h3 class="text-base font-bold text-white">Tolak Usulan Perubahan?</h3>
				<p class="text-xs text-slate-400">Pegawai: {currentDetail?.namaPegawai}</p>
			</div>
		</div>

		<p class="text-xs text-slate-300 leading-relaxed">
			Harap berikan alasan / catatan penolakan yang jelas agar unit pengusul (OPD) dapat memahami alasan penolakan dan memperbaikinya jika diperlukan.
		</p>

		<div class="space-y-1.5">
			<Label class="text-xs text-slate-300 font-semibold">
				Alasan Penolakan <span class="text-rose-400">*</span>
			</Label>
			<textarea
				rows="3"
				placeholder="Contoh: Dokumen SK Pengangkatan tidak terbaca atau buram, mohon upload ulang."
				bind:value={rejectCatatan}
				class="w-full rounded-md border border-slate-800 bg-slate-950/60 p-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
			></textarea>
			{#if rejectError}
				<p class="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
					<AlertCircle class="h-3 w-3" />
					{rejectError}
				</p>
			{/if}
		</div>

		<div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
			<Button
				variant="outline"
				class="border-slate-800 bg-slate-900 text-slate-300 text-xs"
				disabled={isRejecting}
				onclick={() => (isRejectOpen = false)}
			>
				Batal
			</Button>
			<Button
				class="bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs"
				disabled={isRejecting}
				onclick={handleReject}
			>
				{#if isRejecting}
					<Loader2 class="h-3.5 w-3.5 mr-1.5 animate-spin" />
					Menolak...
				{:else}
					<XCircle class="h-3.5 w-3.5 mr-1.5" />
					Tolak Usulan
				{/if}
			</Button>
		</div>
	</div>
</Dialog>
