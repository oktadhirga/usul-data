<script lang="ts">
	import { authState } from "$lib/stores/auth.svelte";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent,
		CardFooter,
	} from "$lib/components/ui/card";
	import { Badge } from "$lib/components/ui/badge";
	import {
		Alert,
		AlertTitle,
		AlertDescription,
	} from "$lib/components/ui/alert";
	import {
		User,
		KeyRound,
		Shield,
		Building2,
		AlertCircle,
		CheckCircle2,
		Loader2,
		Eye,
		EyeOff,
	} from "lucide-svelte";

	let oldPassword = $state("");
	let newPassword = $state("");
	let confirmPassword = $state("");
	let showOldPassword = $state(false);
	let showNewPassword = $state(false);
	let showConfirmPassword = $state(false);

	let isSubmitting = $state(false);
	let alert = $state<{
		type: "success" | "destructive";
		title: string;
		desc: string;
	} | null>(null);

	async function handleChangePassword(e: SubmitEvent) {
		e.preventDefault();
		alert = null;

		if (!oldPassword || !newPassword || !confirmPassword) {
			alert = {
				type: "destructive",
				title: "Validasi Gagal",
				desc: "Semua kolom password wajib diisi.",
			};
			return;
		}

		if (newPassword.length < 6) {
			alert = {
				type: "destructive",
				title: "Password Terlalu Pendek",
				desc: "Password baru minimal harus terdiri dari 6 karakter.",
			};
			return;
		}

		if (newPassword !== confirmPassword) {
			alert = {
				type: "destructive",
				title: "Password Tidak Cocok",
				desc: "Konfirmasi password baru tidak sesuai dengan password baru.",
			};
			return;
		}

		isSubmitting = true;
		const res = await authState.changePassword(oldPassword, newPassword);
		isSubmitting = false;

		if (res.success) {
			alert = {
				type: "success",
				title: "Berhasil",
				desc: "Password Anda telah berhasil diperbarui.",
			};
			oldPassword = "";
			newPassword = "";
			confirmPassword = "";
		} else {
			alert = {
				type: "destructive",
				title: "Gagal Mengubah Password",
				desc:
					res.message ||
					"Password lama salah atau terjadi kesalahan.",
			};
		}
	}
</script>

<svelte:head>
	<title>Profil & Keamanan Akun - ASN-Sync</title>
</svelte:head>

<div class="space-y-6 max-w-4xl mx-auto">
	<!-- Page Header -->
	<div>
		<h2
			class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
		>
			Profil & Keamanan Akun
		</h2>
		<p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
			Informasi akun dan pengaturan kata sandi untuk akun Anda.
		</p>
	</div>

	{#if alert}
		<Alert variant={alert.type} class="py-3">
			{#if alert.type === "success"}
				<CheckCircle2 class="h-4 w-4" />
			{:else}
				<AlertCircle class="h-4 w-4" />
			{/if}
			<AlertTitle class="text-sm font-semibold">{alert.title}</AlertTitle>
			<AlertDescription class="text-xs">{alert.desc}</AlertDescription>
		</Alert>
	{/if}

	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<!-- Profile Details Card -->
		<Card
			class="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 md:col-span-1 h-fit"
		>
			<CardHeader class="text-center pb-4">
				<div
					class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-indigo-500/40 text-2xl font-bold text-indigo-600 dark:text-indigo-400 shadow-md mb-3"
				>
					{authState.user?.username.slice(0, 2).toUpperCase() || "U"}
				</div>
				<CardTitle
					class="text-lg font-bold text-slate-900 dark:text-white"
				>
					@{authState.user?.username || "-"}
				</CardTitle>
			</CardHeader>
			<CardContent
				class="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs"
			>
				<div class="space-y-1">
					<span
						class="text-slate-500 flex items-center gap-1.5 font-medium"
					>
						<Shield
							class="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400"
						/>
						Peran / Role:
					</span>
					<Badge
						variant={authState.isAdmin
							? "default"
							: authState.isVerifikator
								? "outline"
								: "secondary"}
						class={`text-xs font-medium ${authState.isVerifikator ? "border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30" : ""}`}
					>
						{authState.user?.role === "Admin"
							? "Admin Pusat"
							: authState.user?.role === "Verifikator"
								? "Verifikator"
								: "Admin OPD"}
					</Badge>
				</div>

				<div class="space-y-1">
					<span
						class="text-slate-500 flex items-center gap-1.5 font-medium"
					>
						<Building2
							class="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400"
						/>
						Unit Kerja / UNOR:
					</span>
					<div
						class="font-mono text-slate-800 dark:text-slate-200 font-semibold"
					>
						{authState.user?.kodeUnor ||
							(authState.isAdmin || authState.isVerifikator
								? "Pusat (Tanpa batasan)"
								: "-")}
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Change Password Card -->
		<Card
			class="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 md:col-span-2 shadow-sm"
		>
			<CardHeader>
				<div class="flex items-center gap-2">
					<KeyRound
						class="h-5 w-5 text-indigo-600 dark:text-indigo-400"
					/>
					<div>
						<CardTitle
							class="text-base font-semibold text-slate-900 dark:text-white"
						>
							Perbarui Kata Sandi
						</CardTitle>
						<CardDescription
							class="text-xs text-slate-500 dark:text-slate-400"
						>
							Pastikan menggunakan kata sandi yang aman dan tidak
							mudah ditebak.
						</CardDescription>
					</div>
				</div>
			</CardHeader>

			<form onsubmit={handleChangePassword}>
				<CardContent class="space-y-4">
					<div class="space-y-1.5">
						<Label for="oldPassword" class="text-xs"
							>Password Saat Ini</Label
						>
						<div class="relative">
							<Input
								id="oldPassword"
								type={showOldPassword ? "text" : "password"}
								placeholder="Masukkan password saat ini"
								bind:value={oldPassword}
								class="pr-10"
								required
								disabled={isSubmitting}
							/>
							<button
								type="button"
								class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
								onclick={() => (showOldPassword = !showOldPassword)}
								title={showOldPassword ? "Sembunyikan password" : "Lihat password"}
								tabindex="-1"
							>
								{#if showOldPassword}
									<EyeOff class="h-4 w-4" />
								{:else}
									<Eye class="h-4 w-4" />
								{/if}
								<span class="sr-only">{showOldPassword ? "Sembunyikan password" : "Lihat password"}</span>
							</button>
						</div>
					</div>

					<div class="space-y-1.5">
						<Label for="newPassword" class="text-xs"
							>Password Baru (Min. 6 Karakter)</Label
						>
						<div class="relative">
							<Input
								id="newPassword"
								type={showNewPassword ? "text" : "password"}
								placeholder="Masukkan password baru"
								bind:value={newPassword}
								class="pr-10"
								required
								minlength={6}
								disabled={isSubmitting}
							/>
							<button
								type="button"
								class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
								onclick={() => (showNewPassword = !showNewPassword)}
								title={showNewPassword ? "Sembunyikan password" : "Lihat password"}
								tabindex="-1"
							>
								{#if showNewPassword}
									<EyeOff class="h-4 w-4" />
								{:else}
									<Eye class="h-4 w-4" />
								{/if}
								<span class="sr-only">{showNewPassword ? "Sembunyikan password" : "Lihat password"}</span>
							</button>
						</div>
					</div>

					<div class="space-y-1.5">
						<Label for="confirmPassword" class="text-xs"
							>Konfirmasi Password Baru</Label
						>
						<div class="relative">
							<Input
								id="confirmPassword"
								type={showConfirmPassword ? "text" : "password"}
								placeholder="Ketik ulang password baru"
								bind:value={confirmPassword}
								class="pr-10"
								required
								minlength={6}
								disabled={isSubmitting}
							/>
							<button
								type="button"
								class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
								onclick={() => (showConfirmPassword = !showConfirmPassword)}
								title={showConfirmPassword ? "Sembunyikan password" : "Lihat password"}
								tabindex="-1"
							>
								{#if showConfirmPassword}
									<EyeOff class="h-4 w-4" />
								{:else}
									<Eye class="h-4 w-4" />
								{/if}
								<span class="sr-only">{showConfirmPassword ? "Sembunyikan password" : "Lihat password"}</span>
							</button>
						</div>
					</div>
				</CardContent>

				<CardFooter
					class="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800/60"
				>
					<Button
						type="submit"
						class="bg-indigo-600 hover:bg-indigo-500 text-xs gap-1.5"
						disabled={isSubmitting}
					>
						{#if isSubmitting}
							<Loader2 class="h-3.5 w-3.5 animate-spin" />
							<span>Menyimpan...</span>
						{:else}
							<span>Perbarui Password</span>
						{/if}
					</Button>
				</CardFooter>
			</form>
		</Card>
	</div>
</div>
