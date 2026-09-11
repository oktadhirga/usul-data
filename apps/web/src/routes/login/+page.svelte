<script lang="ts">
	import { goto } from '$app/navigation';
	import { authState } from '$lib/stores/auth.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '$lib/components/ui/card';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert';
	import { Lock, User, AlertCircle, Loader2 } from 'lucide-svelte';

	let username = $state('');
	let password = $state('');
	let errorMessage = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (authState.isInitialized && authState.isAuthenticated) {
			goto('/');
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!username || !password) {
			errorMessage = 'Username dan password wajib diisi';
			return;
		}

		errorMessage = '';
		isSubmitting = true;

		const result = await authState.login(username, password);
		isSubmitting = false;

		if (result.success) {
			goto('/');
		} else {
			errorMessage = result.message || 'Login gagal. Periksa username dan password Anda.';
		}
	}
</script>

<svelte:head>
	<title>Masuk - Usul Data</title>
</svelte:head>

<div class="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
	<!-- Background subtle decorative glow -->
	<div class="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
	<div class="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

	<div class="w-full max-w-md relative z-10">
		<Card class="border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl">
			<CardHeader class="space-y-2 text-center pb-6">
				<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-black text-xl shadow-lg shadow-indigo-600/25 mb-2">
					UD
				</div>
				<CardTitle class="text-2xl font-bold tracking-tight text-white">
					Selamat Datang
				</CardTitle>
				<CardDescription class="text-slate-400 text-sm">
					Masuk ke Sistem Pengusulan Data untuk mengakses portal kerja Anda
				</CardDescription>
			</CardHeader>

			<form onsubmit={handleSubmit}>
				<CardContent class="space-y-4">
					{#if errorMessage}
						<Alert variant="destructive" class="py-2.5">
							<AlertCircle class="h-4 w-4" />
							<AlertTitle class="text-sm font-semibold">Gagal Masuk</AlertTitle>
							<AlertDescription class="text-xs">{errorMessage}</AlertDescription>
						</Alert>
					{/if}

					<div class="space-y-1.5">
						<Label for="username" class="text-xs font-semibold uppercase tracking-wider text-slate-300">
							Username
						</Label>
						<div class="relative">
							<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
								<User class="h-4 w-4" />
							</div>
							<Input
								id="username"
								type="text"
								placeholder="Masukkan username"
								class="pl-9 bg-slate-950/60 border-slate-800 focus-visible:ring-indigo-500"
								bind:value={username}
								autocomplete="username"
								required
								disabled={isSubmitting}
							/>
						</div>
					</div>

					<div class="space-y-1.5">
						<Label for="password" class="text-xs font-semibold uppercase tracking-wider text-slate-300">
							Password
						</Label>
						<div class="relative">
							<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
								<Lock class="h-4 w-4" />
							</div>
							<Input
								id="password"
								type="password"
								placeholder="Masukkan password"
								class="pl-9 bg-slate-950/60 border-slate-800 focus-visible:ring-indigo-500"
								bind:value={password}
								autocomplete="current-password"
								required
								disabled={isSubmitting}
							/>
						</div>
					</div>
				</CardContent>

				<CardFooter class="flex flex-col space-y-3 pt-2">
					<Button
						type="submit"
						class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 shadow-md shadow-indigo-600/20"
						disabled={isSubmitting}
					>
						{#if isSubmitting}
							<Loader2 class="h-4 w-4 animate-spin" />
							<span>Memproses...</span>
						{:else}
							<span>Masuk ke Akun</span>
						{/if}
					</Button>

					<p class="text-center text-xs text-slate-500">
						Gunakan kredensial yang telah didaftarkan oleh administrator sistem.
					</p>
				</CardFooter>
			</form>
		</Card>
	</div>
</div>
