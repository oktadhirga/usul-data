<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authState } from '$lib/stores/auth.svelte';
	import { fetchPegawaiList, type PegawaiItem } from '$lib/api/pegawai';
	import {
		createUsulanDraft,
		uploadUsulanDokumen,
		submitUsulan,
		fetchUsulanDetail,
		updateUsulan,
		type JenisUsulan,
		type KategoriUbah,
		type UsulanDokumen
	} from '$lib/api/usulan';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert';
	import {
		User,
		Building2,
		Briefcase,
		FileText,
		Upload,
		CheckCircle2,
		AlertCircle,
		ArrowLeft,
		ArrowRight,
		Search,
		Loader2,
		Trash2,
		Plus,
		Info,
		Send,
		ChevronDown,
		Pencil
	} from 'lucide-svelte';

	// Edit Mode states
	let isEditMode = $state(false);
	let editingUsulanId = $state<number | null>(null);
	let existingStatus = $state<string | null>(null);
	let existingDocuments = $state<UsulanDokumen[]>([]);
	let isLoadingDetail = $state(false);

	// Multi-step Wizard
	let currentStep = $state(1);

	// Step 1: Pegawai Selection
	let pegawaiList = $state<PegawaiItem[]>([]);
	let isLoadingPegawai = $state(false);
	let searchPegawai = $state('');
	let selectedPegawai = $state<PegawaiItem | null>(null);

	// Step 2: Jenis Usulan & Kategori
	const kategoriOptions: KategoriUbah[] = [
		'Data Pribadi',
		'Data Keluarga',
		'Golongan',
		'Jabatan',
		'Pendidikan',
		'Pindah Instansi',
		'Diklat/Kursus'
	];

	const jenisOptions: { value: JenisUsulan; label: string; desc: string }[] = [
		{ value: 'ubah', label: 'Ubah Data', desc: 'Memperbarui data atau riwayat pegawai yang sudah ada' },
		{ value: 'tambah', label: 'Tambah Data', desc: 'Menambahkan riwayat / data baru ke profil pegawai' },
		{ value: 'hapus', label: 'Hapus Data', desc: 'Menghapus data / riwayat yang salah atau kadaluarsa' }
	];

	let selectedKategori = $state<KategoriUbah>('Data Pribadi');
	let selectedJenis = $state<JenisUsulan>('ubah');

	// Step 3: Rincian Field Perubahan
	interface FieldRow {
		id: string;
		fieldName: string;
		nilaiLama: string;
		nilaiBaru: string;
	}

	let fields = $state<FieldRow[]>([
		{ id: '1', fieldName: '', nilaiLama: '', nilaiBaru: '' }
	]);
	let catatanPengusul = $state('');

	// Step 4: Upload Dokumen Pendukung
	let attachedFile = $state<File | null>(null);
	let documentName = $state('');
	let fileError = $state<string | null>(null);

	// Feedback Alert
	let alertMessage = $state<{ type: 'success' | 'destructive'; title: string; desc: string } | null>(null);
	let isSubmitting = $state(false);

	// Filtered pegawai based on search query
	const filteredPegawai = $derived(() => {
		if (!searchPegawai.trim()) return pegawaiList;
		const q = searchPegawai.toLowerCase().trim();
		return pegawaiList.filter(
			(p) =>
				p.nama.toLowerCase().includes(q) ||
				p.nip.toLowerCase().includes(q) ||
				p.jabatan.toLowerCase().includes(q)
		);
	});

	// Document requirement rule:
	// 'tambah' and 'ubah' require document; 'hapus' does not.
	const hasValidDocument = $derived(
		(existingDocuments && existingDocuments.length > 0) || !!attachedFile
	);

	const isDocumentRequired = $derived(
		selectedJenis === 'tambah' || selectedJenis === 'ubah'
	);

	function addFieldRow() {
		fields.push({
			id: Math.random().toString(36).substring(2, 9),
			fieldName: '',
			nilaiLama: '',
			nilaiBaru: ''
		});
	}

	function removeFieldRow(id: string) {
		if (fields.length > 1) {
			fields = fields.filter((f) => f.id !== id);
		}
	}

	function handleFileSelect(e: Event) {
		fileError = null;
		const target = e.target as HTMLInputElement;
		const files = target.files;
		if (!files || files.length === 0) {
			attachedFile = null;
			return;
		}

		const file = files[0];

		// Validasi format PDF
		const isPdf =
			file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
		if (!isPdf) {
			fileError = 'Format berkas harus berekstensi PDF (*.pdf).';
			attachedFile = null;
			target.value = '';
			return;
		}

		// Validasi ukuran maks 1 MB (1048576 bytes)
		const MAX_SIZE = 1 * 1024 * 1024;
		if (file.size > MAX_SIZE) {
			fileError = `Ukuran berkas (${(file.size / (1024 * 1024)).toFixed(2)} MB) melebihi batas maksimum 1 MB.`;
			attachedFile = null;
			target.value = '';
			return;
		}

		attachedFile = file;
		if (!documentName) {
			documentName = file.name.replace(/\.[^/.]+$/, '');
		}
	}

	function validateStep(step: number): boolean {
		alertMessage = null;

		if (step === 1) {
			if (!selectedPegawai) {
				alertMessage = {
					type: 'destructive',
					title: 'Pilih Pegawai',
					desc: 'Silakan pilih salah satu pegawai untuk melanjutkan pengajuan usulan.'
				};
				return false;
			}
			return true;
		}

		if (step === 2) {
			if (!selectedJenis || !selectedKategori) {
				alertMessage = {
					type: 'destructive',
					title: 'Pilih Kategori & Jenis',
					desc: 'Silakan tentukan jenis usulan dan kategori data yang akan diubah.'
				};
				return false;
			}
			return true;
		}

		if (step === 3) {
			const validFields = fields.filter((f) => f.fieldName.trim().length > 0);
			if (validFields.length === 0) {
				alertMessage = {
					type: 'destructive',
					title: 'Rincian Perubahan Kosong',
					desc: 'Harap isi minimal 1 nama field yang hendak diubah / ditambahkan / dihapus.'
				};
				return false;
			}
			return true;
		}

		if (step === 4) {
			if (isDocumentRequired && !hasValidDocument) {
				alertMessage = {
					type: 'destructive',
					title: 'Dokumen Pendukung Wajib',
					desc: `Usulan dengan jenis "${selectedJenis}" wajib melampirkan berkas bukti pendukung berformat PDF (maksimal 1 MB).`
				};
				return false;
			}
			return true;
		}

		return true;
	}

	function goToNextStep() {
		if (validateStep(currentStep)) {
			currentStep = Math.min(5, currentStep + 1);
		}
	}

	function goToPrevStep() {
		alertMessage = null;
		currentStep = Math.max(1, currentStep - 1);
	}

	async function handleSubmit(shouldSubmitDirectly = false) {
		if (!selectedPegawai) return;

		const validFields = fields
			.filter((f) => f.fieldName.trim().length > 0)
			.map((f) => ({
				jenisUsulan: selectedJenis,
				kategoriUbah: selectedKategori,
				fieldName: f.fieldName.trim(),
				nilaiLama: f.nilaiLama.trim() || null,
				nilaiBaru: f.nilaiBaru.trim() || null
			}));

		if (validFields.length === 0) {
			alertMessage = {
				type: 'destructive',
				title: 'Rincian Perubahan Kosong',
				desc: 'Harap isi minimal 1 nama field rincian perubahan.'
			};
			return;
		}

		if (shouldSubmitDirectly && isDocumentRequired && !hasValidDocument) {
			alertMessage = {
				type: 'destructive',
				title: 'Dokumen Pendukung Wajib',
				desc: `Usulan jenis "${selectedJenis}" wajib melampirkan minimal 1 dokumen pendukung PDF sebelum diajukan.`
			};
			return;
		}

		isSubmitting = true;
		alertMessage = null;

		try {
			// Mode Edit Usulan (status: draft atau dibatalkan)
			if (isEditMode && editingUsulanId) {
				// 1. Update data rincian dan catatan
				const updateRes = await updateUsulan(editingUsulanId, {
					catatan: catatanPengusul.trim() || undefined,
					details: validFields
				});

				if (!updateRes.success) {
					isSubmitting = false;
					alertMessage = {
						type: 'destructive',
						title: 'Gagal Memperbarui Usulan',
						desc: updateRes.message || 'Terjadi kesalahan saat menyimpan perubahan usulan.'
					};
					return;
				}

				// 2. Upload Dokumen baru jika ada berkas baru yang dipilih
				if (attachedFile) {
					const uploadRes = await uploadUsulanDokumen(
						editingUsulanId,
						attachedFile,
						documentName.trim() || attachedFile.name
					);

					if (!uploadRes.success) {
						isSubmitting = false;
						alertMessage = {
							type: 'destructive',
							title: 'Gagal Mengunggah Dokumen',
							desc: uploadRes.message || 'Perubahan tersimpan, namun berkas pendukung baru gagal diunggah.'
						};
						return;
					}
				}

				// 3. Jika user memilih langsung mengajukan / mengusulkan kembali
				if (shouldSubmitDirectly) {
					const submitRes = await submitUsulan(editingUsulanId);
					if (!submitRes.success) {
						isSubmitting = false;
						alertMessage = {
							type: 'destructive',
							title: 'Gagal Mengajukan Usulan',
							desc: submitRes.message || 'Perubahan tersimpan namun gagal mengajukan usulan.'
						};
						return;
					}
				}

				isSubmitting = false;
				goto('/usulan');
				return;
			}

			// Mode Buat Baru:
			// 1. Buat Draft Usulan
			const draftRes = await createUsulanDraft({
				pegawaiId: selectedPegawai.id,
				catatan: catatanPengusul.trim() || undefined,
				details: validFields
			});

			if (!draftRes.success || !draftRes.data?.id) {
				isSubmitting = false;
				alertMessage = {
					type: 'destructive',
					title: 'Gagal Membuat Draft',
					desc: draftRes.message || 'Terjadi kesalahan saat menyimpan draft usulan.'
				};
				return;
			}

			const usulanId = draftRes.data.id;

			// 2. Upload Dokumen jika ada
			if (attachedFile) {
				const uploadRes = await uploadUsulanDokumen(
					usulanId,
					attachedFile,
					documentName.trim() || attachedFile.name
				);

				if (!uploadRes.success) {
					isSubmitting = false;
					alertMessage = {
						type: 'destructive',
						title: 'Gagal Mengunggah Dokumen',
						desc: uploadRes.message || 'Draft tersimpan, namun berkas pendukung gagal diunggah.'
					};
					return;
				}
			}

			// 3. Jika user memilih langsung mengajukan (Submit)
			if (shouldSubmitDirectly) {
				const submitRes = await submitUsulan(usulanId);
				if (!submitRes.success) {
					isSubmitting = false;
					alertMessage = {
						type: 'destructive',
						title: 'Gagal Mengajukan Usulan',
						desc: submitRes.message || 'Draft berhasil dibuat namun gagal diajukan.'
					};
					return;
				}
			}

			isSubmitting = false;
			goto('/usulan');
		} catch (err: any) {
			isSubmitting = false;
			alertMessage = {
				type: 'destructive',
				title: 'Terjadi Kesalahan',
				desc: err.message || 'Gagal memproses usulan perubahan.'
			};
		}
	}

	async function loadDetailForEdit(id: number) {
		isLoadingDetail = true;
		const res = await fetchUsulanDetail(id);
		isLoadingDetail = false;
		if (!res.success || !res.data) {
			alertMessage = {
				type: 'destructive',
				title: 'Gagal Memuat Usulan',
				desc: res.message || 'Usulan yang hendak diedit tidak ditemukan.'
			};
			return;
		}

		const data = res.data;
		existingStatus = data.status;

		if (data.status !== 'draft' && data.status !== 'dibatalkan' && data.status !== 'ditolak') {
			alertMessage = {
				type: 'destructive',
				title: 'Status Tidak Dapat Diedit',
				desc: `Usulan dengan status "${data.status}" tidak dapat diedit.`
			};
			return;
		}

		const found = pegawaiList.find((p) => p.id === data.pegawaiId);
		if (found) {
			selectedPegawai = found;
		} else {
			selectedPegawai = {
				id: data.pegawaiId,
				nip: data.nipPegawai || '',
				nama: data.namaPegawai || '',
				jabatan: data.jabatanPegawai || '',
				kodeUnor: data.kodeUnor || '',
				namaUnor: data.namaUnor || '',
				status: 'Aktif'
			} as PegawaiItem;
		}

		catatanPengusul = data.catatan || '';
		existingDocuments = data.dokumen || [];

		if (data.details && data.details.length > 0) {
			selectedJenis = data.details[0].jenisUsulan;
			selectedKategori = data.details[0].kategoriUbah;
			fields = data.details.map((d: any) => ({
				id: String(d.id || Math.random()),
				fieldName: d.fieldName,
				nilaiLama: d.nilaiLama || '',
				nilaiBaru: d.nilaiBaru || ''
			}));
		}
	}

	onMount(async () => {
		isLoadingPegawai = true;
		const res = await fetchPegawaiList();
		isLoadingPegawai = false;
		if (res.success && Array.isArray(res.data)) {
			pegawaiList = res.data;
		}

		const queryEditId = page.url.searchParams.get('editId');
		if (queryEditId) {
			const idNum = Number(queryEditId);
			if (!isNaN(idNum) && idNum > 0) {
				isEditMode = true;
				editingUsulanId = idNum;
				await loadDetailForEdit(idNum);
			}
		}
	});
</script>

<svelte:head>
	<title>{isEditMode ? 'Edit Usulan' : 'Buat Usulan Baru'} - ASN-Sync</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<!-- Back Button & Header -->
	<div class="flex items-center justify-between">
		<button
			type="button"
			onclick={() => goto('/usulan')}
			class="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
		>
			<ArrowLeft class="h-4 w-4" />
			<span>Kembali ke Riwayat Usulan</span>
		</button>
	</div>

	<!-- Title & Wizard Stepper -->
	<div class="space-y-4">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
				{isEditMode ? 'Edit Usulan Perubahan Data' : 'Formulir Usulan Perubahan Data'}
			</h1>
			<p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
				{isEditMode
					? 'Perbarui rincian usulan dan berkas pendukung, lalu simpan sebagai draft atau ajukan kembali usulan ini.'
					: 'Ajukan usulan penambahan, perubahan, atau penghapusan data pegawai sesuai kewenangan UNOR Anda.'}
			</p>
		</div>

		{#if isEditMode}
			<div class="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
				<div class="flex items-center gap-2">
					<Pencil class="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
					<span>
						Mode Edit Usulan <strong>#{editingUsulanId}</strong> • Status Saat Ini: <strong class="uppercase font-semibold text-amber-700 dark:text-amber-200">{existingStatus}</strong>
					</span>
				</div>
				{#if existingStatus === 'dibatalkan' || existingStatus === 'ditolak'}
					<span class="text-[11px] text-amber-700 dark:text-amber-200/80 hidden sm:inline">
						{existingStatus === 'ditolak'
							? 'Usulan yang ditolak dapat diperbaiki rinciannya dan diajukan kembali ke verifikator.'
							: 'Usulan yang dibatalkan dapat diajukan kembali ke verifikator setelah diperbarui.'}
					</span>
				{/if}
			</div>
		{/if}

		<!-- Step Progress Indicators -->
		<div class="grid grid-cols-5 gap-2 pt-2">
			{#each [
				{ num: 1, title: 'Pegawai' },
				{ num: 2, title: 'Kategori' },
				{ num: 3, title: 'Rincian Field' },
				{ num: 4, title: 'Dokumen' },
				{ num: 5, title: 'Konfirmasi' }
			] as step}
				<div class="flex flex-col gap-1.5">
					<div
						class={`h-1.5 rounded-full transition-all duration-300 ${
							currentStep >= step.num ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
						}`}
					></div>
					<span
						class={`text-[11px] font-medium transition-colors hidden sm:block ${
							currentStep === step.num
								? 'text-indigo-600 dark:text-indigo-400 font-semibold'
								: currentStep > step.num
								? 'text-slate-700 dark:text-slate-300'
								: 'text-slate-400 dark:text-slate-500'
						}`}
					>
						{step.num}. {step.title}
					</span>
				</div>
			{/each}
		</div>
	</div>

	<!-- Alerts -->
	{#if alertMessage}
		<Alert variant={alertMessage.type} class="border shadow-lg">
			<div class="flex items-start gap-3">
				{#if alertMessage.type === 'success'}
					<CheckCircle2 class="h-5 w-5 text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0" />
				{:else}
					<AlertCircle class="h-5 w-5 text-rose-500 dark:text-rose-400 mt-0.5 shrink-0" />
				{/if}
				<div class="flex-1">
					<AlertTitle class="font-semibold text-slate-900 dark:text-white">{alertMessage.title}</AlertTitle>
					<AlertDescription class="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
						{alertMessage.desc}
					</AlertDescription>
				</div>
				<button
					type="button"
					onclick={() => (alertMessage = null)}
					class="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs px-2 py-1 rounded"
				>
					Tutup
				</button>
			</div>
		</Alert>
	{/if}

	<!-- Wizard Content Cards -->
	<Card class="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 backdrop-blur-md">
		<!-- STEP 1: PILIH PEGAWAI -->
		{#if currentStep === 1}
			<CardHeader class="border-b border-slate-100 dark:border-slate-800/80 p-6 sm:p-7 pb-4">
				<CardTitle class="text-lg text-slate-900 dark:text-white flex items-center gap-2">
					<User class="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
					Langkah 1: Pilih Pegawai Yang Diusulkan
				</CardTitle>
				<CardDescription class="text-slate-500 dark:text-slate-400">
					Pilih data pegawai dari daftar unit kerja Anda yang akan dilakukan perubahan datanya.
				</CardDescription>
			</CardHeader>

			<CardContent class="space-y-6 p-6 sm:p-7 pt-6">
				<!-- Search Pegawai Input -->
				<div class="space-y-2">
					<Label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Pencarian Pegawai:</Label>
					<div class="flex items-center w-full h-12 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 gap-3.5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
						<Search class="h-5 w-5 text-slate-400 dark:text-slate-500 shrink-0" />
						<input
							type="text"
							placeholder="Cari berdasarkan nama, NIP, atau jabatan..."
							bind:value={searchPegawai}
							class="w-full h-full bg-transparent text-slate-900 dark:text-slate-200 text-sm focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 border-none p-0"
						/>
					</div>
				</div>

				<!-- Pegawai List Grid -->
				<div class="space-y-2.5">
					<div class="flex items-center justify-between">
						<Label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Daftar Pegawai:</Label>
						<span class="text-xs text-slate-500">{filteredPegawai().length} Pegawai ditemukan</span>
					</div>

					{#if isLoadingPegawai}
						<div class="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
							<Loader2 class="h-7 w-7 animate-spin text-indigo-500" />
							<p class="text-xs">Memuat daftar pegawai...</p>
						</div>
					{:else if filteredPegawai().length === 0}
						<div class="py-16 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
							<p class="text-sm text-slate-600 dark:text-slate-400">Pegawai tidak ditemukan.</p>
							<p class="text-xs text-slate-500 mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
						</div>
					{:else}
						<div class="max-h-[28rem] overflow-y-auto space-y-3 pr-2">
							{#each filteredPegawai() as p}
								<button
									type="button"
									class={`w-full text-left p-4 sm:p-5 rounded-xl border transition-all flex items-center justify-between gap-4 cursor-pointer ${
										selectedPegawai?.id === p.id
											? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-600/10 ring-2 ring-indigo-500/50 shadow-md shadow-indigo-500/10'
											: 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
									}`}
									onclick={() => (selectedPegawai = p)}
								>
									<div class="space-y-2 flex-1 min-w-0">
										<div class="flex items-center gap-2.5 flex-wrap">
											<p class="font-bold text-base text-slate-900 dark:text-slate-100 truncate">{p.nama}</p>
											{#if selectedPegawai?.id === p.id}
												<Badge class="bg-indigo-600 text-white text-xs px-2.5 py-0.5">Terpilih</Badge>
											{/if}
										</div>
										<div class="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
											<span class="font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20">
												NIP: {p.nip}
											</span>
											<span class="flex items-center gap-1.5">
												<Briefcase class="h-3.5 w-3.5 text-slate-500" />
												{p.jabatan}
											</span>
											<span class="flex items-center gap-1.5">
												<Building2 class="h-3.5 w-3.5 text-slate-500" />
												{p.namaUnor || p.kodeUnor}
											</span>
										</div>
									</div>
									{#if selectedPegawai?.id === p.id}
										<div class="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white shrink-0 shadow-sm">
											<CheckCircle2 class="h-5 w-5" />
										</div>
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</CardContent>
		{/if}

		<!-- STEP 2: JENIS USULAN & KATEGORI -->
		{#if currentStep === 2}
			<CardHeader class="border-b border-slate-200 dark:border-slate-800/80 p-6 sm:p-7 pb-4">
				<CardTitle class="text-lg text-slate-900 dark:text-white flex items-center gap-2">
					<Briefcase class="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
					Langkah 2: Pilih Jenis Usulan & Kategori Data
				</CardTitle>
				<CardDescription class="text-slate-500 dark:text-slate-400">
					Tentukan jenis tindakan permohonan dan rumpun kategori data yang akan diajukan.
				</CardDescription>
			</CardHeader>

			<CardContent class="space-y-7 p-6 sm:p-7 pt-6">
				<!-- Jenis Usulan Selection -->
				<div class="space-y-3">
					<Label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Jenis Usulan:</Label>
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
						{#each jenisOptions as opt}
							<button
								type="button"
								class={`p-5 rounded-xl border text-left transition-all cursor-pointer ${
									selectedJenis === opt.value
										? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-600/10 ring-2 ring-indigo-500/40 shadow-sm'
										: 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/30'
								}`}
								onclick={() => (selectedJenis = opt.value)}
							>
								<div class="flex items-center justify-between mb-1.5">
									<span class="font-bold text-sm text-slate-900 dark:text-slate-200">{opt.label}</span>
									{#if selectedJenis === opt.value}
										<CheckCircle2 class="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
									{/if}
								</div>
								<p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{opt.desc}</p>
								<div class="mt-3.5">
									{#if opt.value === 'hapus'}
										<Badge variant="outline" class="text-[10px] border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5">
											Dokumen Opsional
										</Badge>
									{:else}
										<Badge variant="outline" class="text-[10px] border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5">
											Wajib Upload PDF
										</Badge>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				</div>

				<!-- Kategori Ubah Selection (Jenis Input Biasa dengan Padding Lapang) -->
				<div class="space-y-2.5">
					<Label for="kategori-select" class="text-sm font-semibold text-slate-700 dark:text-slate-300">Kategori Data:</Label>
					<p class="text-xs text-slate-500 dark:text-slate-400">Pilih rumpun kategori data yang akan diajukan perubahannya:</p>
					<div class="relative mt-1">
						<select
							id="kategori-select"
							bind:value={selectedKategori}
							class="w-full h-12 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer appearance-none pr-10"
						>
							{#each kategoriOptions as kat}
								<option value={kat} class="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 py-2.5 px-4">{kat}</option>
							{/each}
						</select>
						<div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
							<ChevronDown class="h-4 w-4" />
						</div>
					</div>
				</div>
			</CardContent>
		{/if}

		<!-- STEP 3: RINCIAN FIELD PERUBAHAN -->
		{#if currentStep === 3}
			<CardHeader class="border-b border-slate-200 dark:border-slate-800/80 p-6 sm:p-7 pb-4">
				<CardTitle class="text-lg text-slate-900 dark:text-white flex items-center gap-2">
					<FileText class="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
					Langkah 3: Rincian Nilai Perubahan
				</CardTitle>
				<CardDescription class="text-slate-500 dark:text-slate-400">
					Tuliskan nama atribut field serta perbandingan nilai lama dan nilai yang diusulkan baru.
				</CardDescription>
			</CardHeader>

			<CardContent class="space-y-6 p-6 sm:p-7 pt-6">
				<div class="space-y-3">
					{#each fields as field, index (field.id)}
						<div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4 space-y-3 relative group">
							<div class="flex items-center justify-between">
								<span class="text-xs font-bold text-indigo-600 dark:text-indigo-400">Field #{index + 1}</span>
								{#if fields.length > 1}
									<Button
										variant="ghost"
										size="sm"
										class="h-7 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-500/10"
										onclick={() => removeFieldRow(field.id)}
									>
										<Trash2 class="h-3.5 w-3.5 mr-1" />
										Hapus Field
									</Button>
								{/if}
							</div>

							<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
								<div class="space-y-1">
									<Label class="text-xs text-slate-600 dark:text-slate-400">Nama Field / Elemen Data *</Label>
									<Input
										type="text"
										placeholder="contoh: Nama Lengkap / Gelar"
										bind:value={field.fieldName}
										class="text-xs"
									/>
								</div>

								<div class="space-y-1">
									<Label class="text-xs text-slate-600 dark:text-slate-400">Nilai Lama (Sebelumnya)</Label>
									<Input
										type="text"
										placeholder="contoh: S1 Ilmu Komputer"
										bind:value={field.nilaiLama}
										class="text-xs"
									/>
								</div>

								<div class="space-y-1">
									<Label class="text-xs text-slate-600 dark:text-slate-400">Nilai Baru (Usulan)</Label>
									<Input
										type="text"
										placeholder="contoh: S2 Manajemen Sistem Informasi"
										bind:value={field.nilaiBaru}
										class="text-xs font-semibold text-emerald-600 dark:text-emerald-400"
									/>
								</div>
							</div>
						</div>
					{/each}

					<Button
						type="button"
						variant="outline"
						size="sm"
						class="w-full border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs py-2"
						onclick={addFieldRow}
					>
						<Plus class="h-3.5 w-3.5 mr-1" />
						Tambah Baris Field Lainnya
					</Button>
				</div>

				<!-- Catatan Pengusul -->
				<div class="space-y-1 pt-2">
					<Label class="text-xs text-slate-700 dark:text-slate-300">Catatan Tambahan Pengusul (Opsional):</Label>
					<textarea
						bind:value={catatanPengusul}
						rows="3"
						placeholder="Berikan keterangan atau alasan perubahan data bila diperlukan..."
						class="w-full rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
					></textarea>
				</div>
			</CardContent>
		{/if}

		<!-- STEP 4: UPLOAD DOKUMEN -->
		{#if currentStep === 4}
			<CardHeader class="border-b border-slate-200 dark:border-slate-800/80 p-6 sm:p-7 pb-4">
				<CardTitle class="text-lg text-slate-900 dark:text-white flex items-center gap-2">
					<Upload class="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
					Langkah 4: Unggah Dokumen Pendukung
				</CardTitle>
				<CardDescription class="text-slate-500 dark:text-slate-400">
					Lampirkan bukti dokumen resmi pengesahan dalam format PDF dengan ukuran maksimum 1 MB.
				</CardDescription>
			</CardHeader>

			<CardContent class="space-y-6 p-6 sm:p-7 pt-6">
				<!-- Mandatory Notice -->
				{#if isDocumentRequired}
					<div class="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
						<Info class="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
						<div>
							<span class="font-semibold">Dokumen Wajib:</span>
							Usulan dengan jenis <strong>{selectedJenis}</strong> wajib melampirkan minimal 1 dokumen pendukung PDF sebelum dapat diajukan.
						</div>
					</div>
				{:else}
					<div class="flex items-start gap-2.5 rounded-lg border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 p-3 text-xs text-slate-700 dark:text-slate-300">
						<Info class="h-4 w-4 mt-0.5 shrink-0 text-slate-500" />
						<div>
							<span class="font-semibold">Dokumen Opsional:</span>
							Untuk usulan penghapusan data, pengunggahan dokumen tidak diwajibkan.
						</div>
					</div>
				{/if}
				<!-- Existing Documents List (Jika ada dari draft/dibatalkan sebelumnya) -->
				{#if existingDocuments && existingDocuments.length > 0}
					<div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-3.5 space-y-2">
						<span class="text-xs font-semibold text-slate-700 dark:text-slate-300">Dokumen Pendukung Yang Sudah Diunggah:</span>
						{#each existingDocuments as doc}
							<div class="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-2.5 text-xs">
								<div class="flex items-center gap-2 overflow-hidden">
									<FileText class="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
									<span class="text-slate-800 dark:text-slate-200 truncate font-medium">{doc.namaDokumen}</span>
									<span class="text-[10px] text-slate-500">
										{doc.ukuranBytes ? `• ${(doc.ukuranBytes / 1024).toFixed(1)} KB` : ''}
									</span>
								</div>
								<a
									href={doc.pathFile.startsWith('/api') ? doc.pathFile : `/api${doc.pathFile}`}
									target="_blank"
									rel="noopener noreferrer"
									class="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2 py-0.5 text-xs text-indigo-600 dark:text-indigo-300 transition-colors shrink-0 ml-2"
								>
									Lihat Berkas
								</a>
							</div>
						{/each}
						<p class="text-[11px] text-slate-500 dark:text-slate-400 italic">
							* Dokumen di atas sudah tersimpan. Anda dapat mengunggah berkas baru di bawah jika ingin menambahkan dokumen lampiran lain.
						</p>
					</div>
				{/if}

				<!-- Dropzone File Upload -->
				<div class="space-y-2">
					<Label class="text-xs text-slate-700 dark:text-slate-300">
						{existingDocuments.length > 0 ? 'Unggah Dokumen Tambahan (PDF Maks 1 MB):' : 'Pilih Berkas PDF (Maks 1 MB):'}
					</Label>
					<div class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 p-6 hover:border-indigo-500 transition-colors">
						<Upload class="h-8 w-8 text-indigo-500 dark:text-indigo-400 mb-2" />
						<p class="text-xs font-semibold text-slate-700 dark:text-slate-300">Pilih berkas dari perangkat Anda</p>
						<p class="text-[11px] text-slate-500 mt-0.5">Format file: .pdf • Ukuran maksimum: 1 MB</p>

						<input
							type="file"
							accept="application/pdf,.pdf"
							onchange={handleFileSelect}
							class="mt-4 text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
						/>
					</div>

					{#if fileError}
						<p class="text-xs text-rose-500 dark:text-rose-400 font-medium">{fileError}</p>
					{/if}
				</div>

				{#if attachedFile}
					<div class="rounded-xl border border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-500/5 p-4 space-y-3">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<FileText class="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
								<div>
									<p class="text-xs font-semibold text-slate-900 dark:text-white">{attachedFile.name}</p>
									<p class="text-[10px] text-slate-500 dark:text-slate-400">
										{(attachedFile.size / 1024).toFixed(1)} KB • application/pdf
									</p>
								</div>
							</div>
							<Badge class="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
								Valid PDF
							</Badge>
						</div>

						<div class="space-y-1">
							<Label class="text-xs text-slate-600 dark:text-slate-400">Judul / Keterangan Dokumen:</Label>
							<Input
								type="text"
								placeholder="contoh: SK Jabatan Fungsional Terakhir"
								bind:value={documentName}
								class="text-xs"
							/>
						</div>
					</div>
				{/if}
			</CardContent>
		{/if}

		<!-- STEP 5: KONFIRMASI & REVIEW -->
		{#if currentStep === 5}
			<CardHeader class="border-b border-slate-200 dark:border-slate-800/80 p-6 sm:p-7 pb-4">
				<CardTitle class="text-lg text-slate-900 dark:text-white flex items-center gap-2">
					<CheckCircle2 class="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
					Langkah 5: Konfirmasi Pengajuan Usulan
				</CardTitle>
				<CardDescription class="text-slate-500 dark:text-slate-400">
					Tinjau ringkasan usulan data sebelum Anda menyimpan sebagai draft atau langsung mengajukannya.
				</CardDescription>
			</CardHeader>

			<CardContent class="space-y-3.5 p-5 sm:p-6 pt-4">
				<!-- Ringkasan Pegawai -->
				{#if selectedPegawai}
					<div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 space-y-2">
						<span class="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Pegawai Terkait</span>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
							<div class="space-y-0.5">
								<span class="text-slate-500">Nama Lengkap:</span>
								<p class="font-bold text-slate-800 dark:text-slate-100">{selectedPegawai.nama}</p>
							</div>
							<div class="space-y-0.5">
								<span class="text-slate-500">NIP:</span>
								<p class="font-mono text-indigo-600 dark:text-indigo-300">{selectedPegawai.nip}</p>
							</div>
							<div class="space-y-0.5">
								<span class="text-slate-500">Jabatan:</span>
								<p class="text-slate-700 dark:text-slate-300">{selectedPegawai.jabatan}</p>
							</div>
							<div class="space-y-0.5">
								<span class="text-slate-500">Unit Organisasi:</span>
								<p class="text-slate-700 dark:text-slate-300">{selectedPegawai.namaUnor || selectedPegawai.kodeUnor}</p>
							</div>
						</div>
					</div>
				{/if}

				<!-- Ringkasan Jenis & Kategori -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3.5 space-y-0.5">
						<span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Jenis Tindakan:</span>
						<p class="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase">{selectedJenis}</p>
					</div>
					<div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3.5 space-y-0.5">
						<span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Kategori Data:</span>
						<p class="text-xs font-bold text-indigo-600 dark:text-indigo-300">{selectedKategori}</p>
					</div>
				</div>

				<!-- Ringkasan Field Changes (Diberikan Card Padded Wrapper) -->
				<div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4 space-y-2.5">
					<span class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Rincian Perubahan Field:</span>
					<div class="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden text-xs bg-white dark:bg-slate-900/60">
						<table class="w-full text-left">
							<thead class="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
								<tr>
									<th class="py-2.5 px-3.5">Nama Field</th>
									<th class="py-2.5 px-3.5">Nilai Lama</th>
									<th class="py-2.5 px-3.5">Nilai Baru</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-950/20">
								{#each fields.filter((f) => f.fieldName.trim().length > 0) as f}
									<tr class="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
										<td class="py-2.5 px-3.5 font-mono text-slate-800 dark:text-slate-200 font-medium">{f.fieldName}</td>
										<td class="py-2.5 px-3.5 text-rose-500 dark:text-rose-300 line-through font-mono">{f.nilaiLama || '-'}</td>
										<td class="py-2.5 px-3.5 text-emerald-600 dark:text-emerald-400 font-bold font-mono">{f.nilaiBaru || '-'}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>

				<!-- Ringkasan Dokumen -->
				<div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3.5 space-y-2">
					<span class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Dokumen Pendukung:</span>
					{#if attachedFile}
						<div class="flex items-center gap-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-2.5 text-xs text-indigo-600 dark:text-indigo-300">
							<FileText class="h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-400" />
							<div>
								<p class="font-semibold text-slate-900 dark:text-slate-100">{documentName || attachedFile.name} (Dokumen Baru)</p>
								<p class="text-[11px] text-slate-500 dark:text-slate-400">
									{(attachedFile.size / 1024).toFixed(1)} KB • application/pdf
								</p>
							</div>
						</div>
					{/if}

					{#if existingDocuments && existingDocuments.length > 0}
						<div class="space-y-1.5">
							{#each existingDocuments as doc}
								<div class="flex items-center gap-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-2 text-xs text-indigo-600 dark:text-indigo-300">
									<FileText class="h-4 w-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
									<div>
										<p class="font-semibold text-slate-800 dark:text-slate-200">{doc.namaDokumen}</p>
										<p class="text-[10px] text-slate-500">
											{doc.ukuranBytes ? `${(doc.ukuranBytes / 1024).toFixed(1)} KB • ` : ''}Telah tersimpan
										</p>
									</div>
								</div>
							{/each}
						</div>
					{/if}

					{#if !attachedFile && (!existingDocuments || existingDocuments.length === 0)}
						<p class="text-xs text-slate-500">Tidak ada berkas dokumen pendukung yang dilampirkan.</p>
					{/if}
				</div>

				{#if catatanPengusul}
					<div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3.5 space-y-1.5">
						<span class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Catatan Pengusul:</span>
						<p class="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{catatanPengusul}</p>
					</div>
				{/if}
			</CardContent>
		{/if}

		<!-- Wizard Navigation Footer -->
		<CardFooter class="flex items-center justify-between border-t border-slate-200 dark:border-slate-800/80 p-6 sm:p-7 pt-5">
			<div>
				{#if currentStep > 1}
					<Button
						variant="outline"
						size="sm"
						onclick={goToPrevStep}
						disabled={isSubmitting}
					>
						<ArrowLeft class="h-4 w-4 mr-1" />
						Sebelumnya
					</Button>
				{/if}
			</div>

			<div class="flex items-center gap-2">
				{#if currentStep < 5}
					<Button
						size="sm"
						class="bg-indigo-600 hover:bg-indigo-500 text-white"
						onclick={goToNextStep}
					>
						Selanjutnya
						<ArrowRight class="h-4 w-4 ml-1" />
					</Button>
				{:else}
					<!-- Option 1: Simpan Draft -->
					<Button
						variant="outline"
						size="sm"
						disabled={isSubmitting}
						onclick={() => handleSubmit(false)}
					>
						{#if isSubmitting}
							<Loader2 class="h-4 w-4 animate-spin mr-1" />
							Menyimpan...
						{:else}
							{isEditMode ? 'Simpan Perubahan (Draft)' : 'Simpan Sebagai Draft'}
						{/if}
					</Button>

					<!-- Option 2: Langsung Ajukan / Ajukan Kembali -->
					<Button
						size="sm"
						class="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
						disabled={isSubmitting}
						onclick={() => handleSubmit(true)}
					>
						{#if isSubmitting}
							<Loader2 class="h-4 w-4 animate-spin mr-1" />
							Mengajukan...
						{:else}
							<Send class="h-4 w-4 mr-1.5" />
							{isEditMode
								? existingStatus === 'dibatalkan' || existingStatus === 'ditolak'
									? 'Simpan & Ajukan Kembali'
									: 'Simpan & Ajukan Usulan'
								: 'Ajukan Usulan Sekarang'}
						{/if}
					</Button>
				{/if}
			</div>
		</CardFooter>
	</Card>
</div>
