<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { authState } from "$lib/stores/auth.svelte";
	import {
		fetchUsulanList,
		fetchUsulanDetail,
		cancelUsulan,
		submitUsulan,
		deleteUsulan,
		type UsulanItem,
		type UsulanStatus,
	} from "$lib/api/usulan";
	import { fetchUnorList, type UnorItem } from "$lib/api/pegawai";
	import { Button } from "$lib/components/ui/button";
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent,
	} from "$lib/components/ui/card";
	import {
		Table,
		TableHeader,
		TableBody,
		TableRow,
		TableHead,
		TableCell,
	} from "$lib/components/ui/table";
	import { Badge } from "$lib/components/ui/badge";
	import { Dialog } from "$lib/components/ui/dialog";
	import {
		Alert,
		AlertTitle,
		AlertDescription,
	} from "$lib/components/ui/alert";
	import {
		FileText,
		Plus,
		Eye,
		Ban,
		Send,
		RefreshCw,
		Building2,
		Loader2,
		AlertCircle,
		CheckCircle2,
		Filter,
		FileDown,
		ArrowRight,
		Trash2,
		Pencil,
		ShieldCheck
	} from "lucide-svelte";

	let usulanList = $state<UsulanItem[]>([]);
	let unorList = $state<UnorItem[]>([]);
	let isLoading = $state(false);
	let selectedUnor = $state<string>("");
	let selectedStatus = $state<string>("all");
	let alertMessage = $state<{
		type: "success" | "destructive";
		title: string;
		desc: string;
	} | null>(null);

	// Detail Modal states
	let isDetailOpen = $state(false);
	let detailLoading = $state(false);
	let currentDetail = $state<UsulanItem | null>(null);

	// Cancel Modal states
	let isCancelOpen = $state(false);
	let cancellingId = $state<number | null>(null);
	let isCancelling = $state(false);

	// Delete Modal states
	let isDeleteOpen = $state(false);
	let deletingId = $state<number | null>(null);
	let isDeleting = $state(false);

	// Quick Submit Draft states
	let isSubmittingDraft = $state(false);

	const userUnorName = $derived(() => {
		if (!authState.user?.kodeUnor) return "";
		const found = unorList.find(
			(u) => u.kodeUnor === authState.user?.kodeUnor,
		);
		return found ? found.namaUnor : authState.user.kodeUnor;
	});

	async function loadUnors() {
		const res = await fetchUnorList();
		if (res.success && Array.isArray(res.data)) {
			unorList = res.data;
		}
	}

	async function loadUsulan() {
		isLoading = true;
		const params: { kode_unor?: string; status?: string } = {};
		if (selectedUnor) params.kode_unor = selectedUnor;
		if (selectedStatus && selectedStatus !== "all")
			params.status = selectedStatus;

		const res = await fetchUsulanList(params);
		isLoading = false;
		if (res.success && Array.isArray(res.data)) {
			usulanList = res.data;
		} else {
			alertMessage = {
				type: "destructive",
				title: "Gagal Memuat Riwayat Usulan",
				desc:
					res.message ||
					"Tidak dapat mengambil daftar usulan perubahan.",
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
				type: "destructive",
				title: "Gagal Memuat Detail",
				desc: res.message || "Tidak dapat memuat detail usulan.",
			};
			isDetailOpen = false;
		}
	}

	function confirmCancel(id: number) {
		cancellingId = id;
		isCancelOpen = true;
	}

	async function handleCancel() {
		if (!cancellingId) return;
		isCancelling = true;

		const res = await cancelUsulan(cancellingId);
		isCancelling = false;
		isCancelOpen = false;

		if (res.success) {
			alertMessage = {
				type: "success",
				title: "Usulan Dibatalkan",
				desc: res.message || "Usulan berhasil dibatalkan.",
			};
			await loadUsulan();
			if (isDetailOpen && currentDetail?.id === cancellingId) {
				await openDetail(cancellingId);
			}
		} else {
			alertMessage = {
				type: "destructive",
				title: "Gagal Membatalkan Usulan",
				desc:
					res.message || "Terjadi kesalahan saat membatalkan usulan.",
			};
		}
		cancellingId = null;
	}

	function confirmDelete(id: number) {
		deletingId = id;
		isDeleteOpen = true;
	}

	async function handleDelete() {
		if (!deletingId) return;
		isDeleting = true;

		const res = await deleteUsulan(deletingId);
		isDeleting = false;
		isDeleteOpen = false;

		if (res.success) {
			alertMessage = {
				type: "success",
				title: "Usulan Berhasil Dihapus",
				desc:
					res.message ||
					"Usulan dan seluruh dokumen terkait telah dihapus secara permanen.",
			};
			await loadUsulan();
			if (isDetailOpen && currentDetail?.id === deletingId) {
				isDetailOpen = false;
				currentDetail = null;
			}
		} else {
			alertMessage = {
				type: "destructive",
				title: "Gagal Menghapus Usulan",
				desc: res.message || "Terjadi kesalahan saat menghapus usulan.",
			};
		}
		deletingId = null;
	}

	async function handleQuickSubmit(id: number) {
		isSubmittingDraft = true;
		const res = await submitUsulan(id);
		isSubmittingDraft = false;

		if (res.success) {
			alertMessage = {
				type: "success",
				title: "Usulan Berhasil Diajukan",
				desc: res.message || "Status usulan kini menjadi diajukan.",
			};
			await loadUsulan();
			if (isDetailOpen && currentDetail?.id === id) {
				await openDetail(id);
			}
		} else {
			alertMessage = {
				type: "destructive",
				title: "Gagal Mengajukan Usulan",
				desc:
					res.message ||
					"Pastikan rincian dan dokumen pendukung sudah lengkap.",
			};
		}
	}

	function getStatusBadgeVariant(status: UsulanStatus): string {
		switch (status) {
			case "draft":
				return "bg-slate-800 text-slate-300 border border-slate-700";
			case "diajukan":
				return "bg-amber-500/10 text-amber-400 border border-amber-500/30";
			case "disetujui":
				return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
			case "ditolak":
				return "bg-rose-500/10 text-rose-400 border border-rose-500/30";
			case "dibatalkan":
				return "bg-slate-700/50 text-slate-400 border border-slate-600 line-through";
			default:
				return "bg-slate-800 text-slate-300";
		}
	}

	function getStatusLabel(status: UsulanStatus): string {
		switch (status) {
			case "draft":
				return "Draft";
			case "diajukan":
				return "Diajukan";
			case "disetujui":
				return "Disetujui";
			case "ditolak":
				return "Ditolak";
			case "dibatalkan":
				return "Dibatalkan";
			default:
				return status;
		}
	}

	function getJenisBadge(jenis: string): string {
		switch (jenis) {
			case "tambah":
				return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
			case "ubah":
				return "bg-sky-500/10 text-sky-400 border border-sky-500/20";
			case "hapus":
				return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
			default:
				return "bg-slate-800 text-slate-300";
		}
	}

	function formatDate(dateStr: string): string {
		if (!dateStr) return "-";
		const d = new Date(dateStr);
		if (isNaN(d.getTime())) return "-";
		return (
			new Intl.DateTimeFormat("id-ID", {
				day: "numeric",
				month: "short",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
				hour12: false,
				timeZone: "Asia/Jakarta",
			}).format(d) + " WIB"
		);
	}

	onMount(async () => {
		await loadUnors();
		await loadUsulan();
	});
</script>

<div class="space-y-6">
	<!-- Alerts -->
	{#if alertMessage}
		<Alert variant={alertMessage.type} class="border shadow-lg">
			<div class="flex items-start gap-3">
				{#if alertMessage.type === "success"}
					<CheckCircle2
						class="h-5 w-5 text-emerald-400 mt-0.5 shrink-0"
					/>
				{:else}
					<AlertCircle
						class="h-5 w-5 text-rose-400 mt-0.5 shrink-0"
					/>
				{/if}
				<div class="flex-1">
					<AlertTitle class="font-semibold text-white"
						>{alertMessage.title}</AlertTitle
					>
					<AlertDescription class="text-sm text-slate-300 mt-0.5">
						{alertMessage.desc}
					</AlertDescription>
				</div>
				<button
					type="button"
					onclick={() => (alertMessage = null)}
					class="text-slate-400 hover:text-white text-xs px-2 py-1 rounded"
				>
					Tutup
				</button>
			</div>
		</Alert>
	{/if}

	<!-- Header -->
	<div
		class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
	>
		<div>
			<div class="flex items-center gap-2">
				<h1 class="text-2xl font-bold tracking-tight text-white">
					Riwayat Usulan Perubahan
				</h1>
				<Badge
					variant="outline"
					class="border-indigo-500/30 bg-indigo-500/10 text-indigo-400 font-medium"
				>
					{usulanList.length} Usulan
				</Badge>
			</div>
			<p class="text-sm text-slate-400 mt-1">
				{#if authState.isAdmin}
					Pantau dan kelola seluruh usulan pembaruan data pegawai
					lintas Unit Organisasi.
				{:else}
					Daftar usulan perubahan data pegawai untuk unit:
					<span class="font-semibold text-indigo-300"
						>{userUnorName() || authState.user?.kodeUnor}</span
					>
				{/if}
			</p>
		</div>

		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				class="border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300"
				onclick={loadUsulan}
				disabled={isLoading}
			>
				<RefreshCw
					class={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
				/>
				Refresh
			</Button>

			<Button
				class="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
				onclick={() => goto("/usulan/baru")}
			>
				<Plus class="h-4 w-4 mr-2" />
				Buat Usulan Baru
			</Button>
		</div>
	</div>

	<!-- Filter Bar -->
	<Card class="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
		<CardContent class="p-4">
			<div class="flex flex-col md:flex-row items-center gap-4">
				<div
					class="flex items-center gap-2 text-slate-400 text-sm shrink-0"
				>
					<Filter class="h-4 w-4" />
					<span>Filter Status:</span>
				</div>

				<!-- Status Filter Pills/Select -->
				<div class="flex flex-wrap items-center gap-1.5 flex-1">
					{#each [{ value: "all", label: "Semua" }, { value: "draft", label: "Draft" }, { value: "diajukan", label: "Diajukan" }, { value: "disetujui", label: "Disetujui" }, { value: "ditolak", label: "Ditolak" }, { value: "dibatalkan", label: "Dibatalkan" }] as opt}
						<button
							type="button"
							class={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
								selectedStatus === opt.value
									? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
									: "bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50"
							}`}
							onclick={() => {
								selectedStatus = opt.value;
								loadUsulan();
							}}
						>
							{opt.label}
						</button>
					{/each}
				</div>

				<!-- Admin UNOR Filter -->
				{#if authState.isAdmin}
					<div class="w-full md:w-64">
						<select
							bind:value={selectedUnor}
							onchange={loadUsulan}
							class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						>
							<option value="">Semua Unit Organisasi</option>
							{#each unorList as u}
								<option value={u.kodeUnor}
									>{u.namaUnor} ({u.kodeUnor})</option
								>
							{/each}
						</select>
					</div>
				{/if}
			</div>
		</CardContent>
	</Card>

	<!-- Table Card -->
	<Card
		class="border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden"
	>
		<div class="overflow-x-auto">
			<Table>
				<TableHeader class="bg-slate-950/60 border-b border-slate-800">
					<TableRow class="hover:bg-transparent border-slate-800">
						<TableHead
							class="w-12 text-center text-slate-400 text-xs"
							>No</TableHead
						>
						<TableHead class="text-slate-400 text-xs"
							>Pegawai</TableHead
						>
						<TableHead class="text-slate-400 text-xs"
							>Unit Organisasi</TableHead
						>
						<TableHead class="text-slate-400 text-xs"
							>Tanggal Buat</TableHead
						>
						<TableHead class="text-center text-slate-400 text-xs"
							>Status</TableHead
						>
						<TableHead
							class="text-right text-slate-400 text-xs pr-6"
							>Aksi</TableHead
						>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if isLoading}
						<TableRow class="border-slate-800/50">
							<TableCell colspan={6} class="h-48 text-center">
								<div
									class="flex flex-col items-center justify-center gap-2 text-slate-400"
								>
									<Loader2
										class="h-6 w-6 animate-spin text-indigo-500"
									/>
									<span class="text-sm"
										>Memuat riwayat usulan...</span
									>
								</div>
							</TableCell>
						</TableRow>
					{:else if usulanList.length === 0}
						<TableRow class="border-slate-800/50">
							<TableCell colspan={6} class="h-48 text-center">
								<div
									class="flex flex-col items-center justify-center gap-3 text-slate-400"
								>
									<div
										class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/80 text-slate-400"
									>
										<FileText class="h-6 w-6" />
									</div>
									<div class="space-y-1">
										<p class="font-medium text-slate-300">
											Belum ada usulan perubahan
										</p>
										<p class="text-xs text-slate-500">
											{#if selectedStatus !== "all"}
												Tidak ada usulan dengan status "{selectedStatus}".
											{:else}
												Ajukan usulan perubahan data
												pegawai dengan tombol di atas.
											{/if}
										</p>
									</div>
									<Button
										variant="outline"
										size="sm"
										class="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 mt-2"
										onclick={() => goto("/usulan/baru")}
									>
										<Plus class="h-3.5 w-3.5 mr-1.5" />
										Buat Usulan Baru
									</Button>
								</div>
							</TableCell>
						</TableRow>
					{:else}
						{#each usulanList as item, idx (item.id)}
							<TableRow
								class="border-slate-800/50 hover:bg-slate-800/30 transition-colors"
							>
								<TableCell
									class="text-center font-mono text-xs text-slate-500"
								>
									{idx + 1}
								</TableCell>
								<TableCell>
									<div class="space-y-0.5">
										<p
											class="font-medium text-slate-200 text-sm"
										>
											{item.namaPegawai ||
												"Pegawai #" + item.pegawaiId}
										</p>
										<p
											class="font-mono text-xs text-slate-400"
										>
											NIP: {item.nipPegawai || "-"}
										</p>
										{#if item.jabatanPegawai}
											<p
												class="text-xs text-slate-500 truncate max-w-xs"
											>
												{item.jabatanPegawai}
											</p>
										{/if}
									</div>
								</TableCell>
								<TableCell>
									<div
										class="flex items-center gap-1.5 text-xs text-slate-300"
									>
										<Building2
											class="h-3.5 w-3.5 text-slate-500 shrink-0"
										/>
										<span class="truncate max-w-xs"
											>{item.namaUnor ||
												item.kodeUnor}</span
										>
									</div>
								</TableCell>
								<TableCell class="text-xs text-slate-400">
									{formatDate(item.createdAt)}
								</TableCell>
								<TableCell class="text-center">
									<span
										class={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeVariant(item.status)}`}
									>
										{getStatusLabel(item.status)}
									</span>
								</TableCell>
								<TableCell class="text-right pr-6">
									<div
										class="flex items-center justify-end gap-1.5"
									>
										<!-- Detail Action -->
										<Button
											variant="ghost"
											size="sm"
											class="h-8 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
											onclick={() => openDetail(item.id)}
										>
											<Eye class="h-3.5 w-3.5 mr-1" />
											Detail
										</Button>

										<!-- Edit / Ajukan Ulang Action (draft atau dibatalkan) -->
										{#if item.status === "draft" || item.status === "dibatalkan"}
											<Button
												variant="outline"
												size="sm"
												class={item.status ===
												"dibatalkan"
													? "h-8 text-xs border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
													: "h-8 text-xs border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"}
												onclick={() =>
													goto(
														`/usulan/baru?editId=${item.id}`,
													)}
											>
												<Pencil
													class="h-3.5 w-3.5 mr-1"
												/>
												{item.status === "dibatalkan"
													? "Edit Usulan"
													: "Edit Draft"}
											</Button>
										{/if}

										<!-- Batalkan Action (hanya status diajukan) -->
										{#if item.status === "diajukan"}
											<Button
												variant="ghost"
												size="sm"
												class="h-8 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
												onclick={() =>
													confirmCancel(item.id)}
											>
												<Ban class="h-3.5 w-3.5 mr-1" />
												Batalkan
											</Button>
										{/if}

										<!-- Hapus Permanen Action (draft atau dibatalkan) -->
										{#if item.status === "draft" || item.status === "dibatalkan"}
											<Button
												variant="ghost"
												size="sm"
												class="h-8 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
												onclick={() =>
													confirmDelete(item.id)}
												title="Hapus Usulan Secara Permanen"
											>
												<Trash2
													class="h-3.5 w-3.5 mr-1"
												/>
												Hapus
											</Button>
										{/if}
									</div>
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</div>
	</Card>
</div>

<!-- Modal Detail Usulan -->
<Dialog
	bind:open={isDetailOpen}
	onclose={() => (isDetailOpen = false)}
	title="Detail Usulan Perubahan Data"
	description="Informasi lengkap pengajuan perubahan data pegawai dan berkas pendukung."
	class="max-w-3xl border-slate-800 bg-slate-900 text-slate-100"
>
	{#if detailLoading}
		<div
			class="flex flex-col items-center justify-center py-16 gap-3 text-slate-400"
		>
			<Loader2 class="h-8 w-8 animate-spin text-indigo-500" />
			<p class="text-sm">Memuat detail usulan...</p>
		</div>
	{:else if currentDetail}
		<div class="space-y-6 pt-2">
			<!-- Header Info Grid -->
			<div
				class="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4"
			>
				<div class="space-y-2">
					<div>
						<span class="text-xs text-slate-500">Nama Pegawai:</span
						>
						<p class="font-semibold text-slate-200">
							{currentDetail.namaPegawai || "-"}
						</p>
					</div>
					<div>
						<span class="text-xs text-slate-500">NIP:</span>
						<p class="font-mono text-xs text-slate-300">
							{currentDetail.nipPegawai || "-"}
						</p>
					</div>
					<div>
						<span class="text-xs text-slate-500">Jabatan:</span>
						<p class="text-xs text-slate-300">
							{currentDetail.jabatanPegawai || "-"}
						</p>
					</div>
				</div>

				<div class="space-y-2">
					<div>
						<span class="text-xs text-slate-500"
							>Unit Organisasi:</span
						>
						<p class="text-xs text-slate-200">
							{currentDetail.namaUnor || currentDetail.kodeUnor}
						</p>
					</div>
					<div>
						<span class="text-xs text-slate-500"
							>Status Saat Ini:</span
						>
						<div class="mt-0.5">
							<span
								class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeVariant(currentDetail.status)}`}
							>
								{getStatusLabel(currentDetail.status)}
							</span>
						</div>
					</div>
					<div>
						<span class="text-xs text-slate-500"
							>Tanggal Pengajuan:</span
						>
						<p class="text-xs text-slate-300">
							{formatDate(currentDetail.createdAt)}
						</p>
					</div>
				</div>
			</div>

			<!-- Catatan -->
			{#if currentDetail.catatan}
				<div
					class="rounded-lg border border-slate-800 bg-slate-950/30 p-3"
				>
					<span class="text-xs font-medium text-slate-400"
						>Catatan Pengusul:</span
					>
					<p class="text-xs text-slate-200 mt-1 whitespace-pre-wrap">
						{currentDetail.catatan}
					</p>
				</div>
			{/if}

			<!-- Rincian Field Yang Diusulkan -->
			<div class="space-y-2">
				<h3
					class="text-sm font-semibold text-slate-200 flex items-center gap-2"
				>
					<FileText class="h-4 w-4 text-indigo-400" />
					Rincian Perubahan Field
				</h3>
				<div
					class="rounded-lg border border-slate-800 overflow-hidden bg-slate-950/40"
				>
					<Table>
						<TableHeader
							class="bg-slate-950/80 border-b border-slate-800"
						>
							<TableRow
								class="hover:bg-transparent border-slate-800 text-xs"
							>
								<TableHead class="text-slate-400"
									>Kategori</TableHead
								>
								<TableHead class="text-slate-400"
									>Jenis</TableHead
								>
								<TableHead class="text-slate-400"
									>Field</TableHead
								>
								<TableHead class="text-slate-400"
									>Nilai Lama</TableHead
								>
								<TableHead class="text-slate-400"
									>Nilai Baru</TableHead
								>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#if !currentDetail.details || currentDetail.details.length === 0}
								<TableRow>
									<TableCell
										colspan={5}
										class="text-center text-xs text-slate-500 py-4"
									>
										Tidak ada rincian perubahan.
									</TableCell>
								</TableRow>
							{:else}
								{#each currentDetail.details as det}
									<TableRow
										class="border-slate-800/40 text-xs"
									>
										<TableCell
											class="font-medium text-slate-300"
											>{det.kategoriUbah}</TableCell
										>
										<TableCell>
											<span
												class={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${getJenisBadge(det.jenisUsulan)}`}
											>
												{det.jenisUsulan}
											</span>
										</TableCell>
										<TableCell
											class="font-mono text-slate-300"
											>{det.fieldName}</TableCell
										>
										<TableCell
											class="text-rose-300/80 font-mono line-through"
											>{det.nilaiLama || "-"}</TableCell
										>
										<TableCell
											class="text-emerald-400 font-mono font-medium"
											>{det.nilaiBaru || "-"}</TableCell
										>
									</TableRow>
								{/each}
							{/if}
						</TableBody>
					</Table>
				</div>
			</div>

			<!-- Dokumen Pendukung -->
			<div class="space-y-2">
				<h3
					class="text-sm font-semibold text-slate-200 flex items-center gap-2"
				>
					<FileDown class="h-4 w-4 text-indigo-400" />
					Dokumen Pendukung
				</h3>
				{#if !currentDetail.dokumen || currentDetail.dokumen.length === 0}
					<div
						class="rounded-lg border border-slate-800/80 bg-slate-950/30 p-4 text-center"
					>
						<p class="text-xs text-slate-400">
							Tidak ada dokumen pendukung yang dilampirkan.
						</p>
					</div>
				{:else}
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{#each currentDetail.dokumen as doc}
							<div
								class="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/40 p-3 hover:border-slate-700 transition-colors"
							>
								<div
									class="flex items-center gap-2.5 overflow-hidden"
								>
									<div
										class="flex h-8 w-8 items-center justify-center rounded bg-rose-500/10 text-rose-400 shrink-0"
									>
										<FileText class="h-4 w-4" />
									</div>
									<div class="overflow-hidden">
										<p
											class="text-xs font-medium text-slate-200 truncate"
										>
											{doc.namaDokumen}
										</p>
										<p class="text-[10px] text-slate-500">
											PDF {doc.ukuranBytes
												? `• ${(doc.ukuranBytes / 1024).toFixed(1)} KB`
												: ""}
										</p>
									</div>
								</div>
								<a
									href={doc.pathFile.startsWith("/api")
										? doc.pathFile
										: `/api${doc.pathFile}`}
									target="_blank"
									rel="noopener noreferrer"
									class="inline-flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs text-indigo-300 transition-colors shrink-0 ml-2"
								>
									<FileDown class="h-3 w-3" />
									Buka
								</a>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Audit Verifikasi (Admin Pusat) -->
			{#if currentDetail.status === "disetujui" || currentDetail.status === "ditolak"}
				<div class="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2.5">
					<div class="flex items-center gap-2">
						<div class="h-6 w-6 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
							<ShieldCheck class="h-3.5 w-3.5" />
						</div>
						<h4 class="text-xs font-semibold uppercase tracking-wider text-slate-300">
							Hasil Verifikasi Admin Pusat
						</h4>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
						<div>
							<span class="text-slate-400">Diverifikasi oleh:</span>
							<p class="font-medium text-slate-200 mt-0.5">
								{currentDetail.verifiedBy || "-"}
							</p>
						</div>
						<div>
							<span class="text-slate-400">Waktu Verifikasi:</span>
							<p class="font-medium text-slate-200 mt-0.5">
								{currentDetail.verifiedAt ? formatDate(currentDetail.verifiedAt) : "-"}
							</p>
						</div>
					</div>

					{#if currentDetail.catatan}
						<div class="pt-2 border-t border-slate-800">
							<span class="text-xs text-slate-400">
								{currentDetail.status === "ditolak" ? "Alasan Penolakan:" : "Catatan Verifikasi:"}
							</span>
							<p class="text-xs text-slate-200 mt-1 bg-slate-900/60 p-2.5 rounded border border-slate-800">
								{currentDetail.catatan}
							</p>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Modal Actions Footer -->
			<div
				class="flex items-center justify-between border-t border-slate-800 pt-4"
			>
				<div class="flex items-center gap-2">
					{#if currentDetail.status === "diajukan"}
						<Button
							variant="outline"
							class="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 text-xs"
							onclick={() => {
								isDetailOpen = false;
								if (currentDetail?.id)
									confirmCancel(currentDetail.id);
							}}
						>
							<Ban class="h-3.5 w-3.5 mr-1" />
							Batalkan Usulan
						</Button>
					{/if}

					{#if currentDetail.status === "draft" || currentDetail.status === "dibatalkan"}
						<Button
							variant="outline"
							class="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 text-xs"
							onclick={() => {
								const id = currentDetail?.id;
								isDetailOpen = false;
								if (id) confirmDelete(id);
							}}
						>
							<Trash2 class="h-3.5 w-3.5 mr-1" />
							Hapus Permanen
						</Button>
					{/if}
				</div>

				<div class="flex items-center gap-2">
					{#if currentDetail.status === "draft" || currentDetail.status === "dibatalkan"}
						<Button
							variant="outline"
							class="border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 text-xs"
							onclick={() => {
								const id = currentDetail?.id;
								isDetailOpen = false;
								if (id) goto(`/usulan/baru?editId=${id}`);
							}}
						>
							<Pencil class="h-3.5 w-3.5 mr-1" />
							{currentDetail.status === "dibatalkan"
								? "Edit & Ajukan Ulang"
								: "Edit Draft"}
						</Button>
					{/if}

					{#if currentDetail.status === "draft" || currentDetail.status === "dibatalkan"}
						<Button
							class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
							disabled={isSubmittingDraft}
							onclick={() =>
								currentDetail?.id &&
								handleQuickSubmit(currentDetail.id)}
						>
							{#if isSubmittingDraft}
								<Loader2
									class="h-3.5 w-3.5 animate-spin mr-1"
								/>
								Mengajukan...
							{:else}
								<Send class="h-3.5 w-3.5 mr-1" />
								{currentDetail.status === "dibatalkan"
									? "Ajukan Kembali"
									: "Ajukan Usulan"}
							{/if}
						</Button>
					{/if}

					<Button
						variant="outline"
						class="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs"
						onclick={() => (isDetailOpen = false)}
					>
						Tutup
					</Button>
				</div>
			</div>
		</div>
	{/if}
</Dialog>

<!-- Modal Konfirmasi Pembatalan -->
<Dialog
	bind:open={isCancelOpen}
	onclose={() => (isCancelOpen = false)}
	title="Batalkan Usulan Perubahan"
	description="Tindakan ini akan membatalkan usulan yang sudah diajukan. Status akan berubah menjadi dibatalkan."
	class="max-w-md border-slate-800 bg-slate-900 text-slate-100"
>
	<div class="space-y-4 pt-2">
		<div
			class="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300"
		>
			Pastikan Anda yakin ingin membatalkan usulan #{cancellingId}. Usulan
			yang dibatalkan nantinya masih dapat diedit dan diajukan kembali
			jika diperlukan.
		</div>

		<div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
			<Button
				variant="outline"
				class="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300"
				onclick={() => (isCancelOpen = false)}
				disabled={isCancelling}
			>
				Kembali
			</Button>
			<Button
				class="bg-rose-600 hover:bg-rose-500 text-white"
				onclick={handleCancel}
				disabled={isCancelling}
			>
				{#if isCancelling}
					<Loader2 class="h-4 w-4 animate-spin mr-1" />
					Membatalkan...
				{:else}
					<Ban class="h-4 w-4 mr-1" />
					Ya, Batalkan Usulan
				{/if}
			</Button>
		</div>
	</div>
</Dialog>

<!-- Modal Konfirmasi Hapus Usulan Permanen -->
<Dialog
	bind:open={isDeleteOpen}
	onclose={() => (isDeleteOpen = false)}
	title="Hapus Usulan Secara Permanen"
	description="Tindakan ini akan menghapus usulan dan berkas lampiran pendukung secara permanen dari server."
	class="max-w-md border-slate-800 bg-slate-900 text-slate-100"
>
	<div class="space-y-4 pt-2">
		<div
			class="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300"
		>
			Peringatan: Usulan #{deletingId} beserta seluruh file dokumen lampirannya
			akan dihapus secara permanen. Data yang dihapus tidak dapat dipulihkan
			kembali.
		</div>

		<div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
			<Button
				variant="outline"
				class="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300"
				onclick={() => (isDeleteOpen = false)}
				disabled={isDeleting}
			>
				Batal
			</Button>
			<Button
				class="bg-rose-600 hover:bg-rose-500 text-white"
				onclick={handleDelete}
				disabled={isDeleting}
			>
				{#if isDeleting}
					<Loader2 class="h-4 w-4 animate-spin mr-1" />
					Menghapus...
				{:else}
					<Trash2 class="h-4 w-4 mr-1" />
					Ya, Hapus Permanen
				{/if}
			</Button>
		</div>
	</div>
</Dialog>
