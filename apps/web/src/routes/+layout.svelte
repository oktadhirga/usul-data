<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import favicon from '$lib/assets/favicon.svg';
	import { authState } from '$lib/stores/auth.svelte';
	import { fetchUnorList, type UnorItem } from '$lib/api/pegawai';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import NotificationBell from '$lib/components/NotificationBell.svelte';
	import {
		LayoutDashboard,
		Users,
		User,
		LogOut,
		Building2,
		Briefcase,
		FileText,
		CheckCheck,
		Menu,
		X
	} from 'lucide-svelte';

	let { children } = $props();

	let isMobileMenuOpen = $state(false);
	let unorList = $state<UnorItem[]>([]);

	const userUnorName = $derived(() => {
		if (!authState.user?.kodeUnor) return '';
		const found = unorList.find((u) => u.kodeUnor === authState.user?.kodeUnor);
		return found ? found.namaUnor : authState.user.kodeUnor;
	});

	const isLoginPage = $derived(page.url.pathname === '/login');

	$effect(() => {
		if (authState.isInitialized && !authState.isAuthenticated && !isLoginPage) {
			goto('/login');
		}
	});

	$effect(() => {
		if (authState.isAuthenticated && authState.user?.kodeUnor && unorList.length === 0) {
			fetchUnorList().then((res) => {
				if (res.success && Array.isArray(res.data)) {
					unorList = res.data;
				}
			});
		}
	});

	async function handleLogout() {
		await authState.logout();
		goto('/login');
	}
</script>

<svelte:head>
	<title>Usul Data - Sistem Kepegawaian & Verifikasi Data</title>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if isLoginPage}
	{@render children()}
{:else}
	<div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
		<!-- Mobile Header -->
		<div class="md:hidden flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3 sticky top-0 z-40 backdrop-blur-md">
			<div class="flex items-center gap-2 font-bold text-lg text-white">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-black text-sm">
					UD
				</div>
				<span>Usul Data</span>
			</div>
			<div class="flex items-center gap-2">
				<NotificationBell />
				<button
					type="button"
					class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
					onclick={() => isMobileMenuOpen = !isMobileMenuOpen}
					aria-label="Toggle menu"
				>
					{#if isMobileMenuOpen}
						<X class="h-5 w-5" />
					{:else}
						<Menu class="h-5 w-5" />
					{/if}
				</button>
			</div>
		</div>

		<!-- Sidebar -->
		<aside
			class={`fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-800 bg-slate-900/95 p-5 flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0 ${
				isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
			}`}
		>
			<div class="space-y-6">
				<!-- Brand Logo -->
				<div class="flex items-center gap-3 px-2 py-1">
					<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-black text-base shadow-md shadow-indigo-600/20">
						UD
					</div>
					<div>
						<h1 class="text-base font-bold text-white tracking-tight leading-none">Usul Data</h1>
						<p class="text-xs text-slate-400 mt-0.5">Sistem Kepegawaian & RBAC</p>
					</div>
				</div>

				<!-- Navigation -->
				<nav class="space-y-1">
					<a
						href="/"
						onclick={() => isMobileMenuOpen = false}
						class={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
							page.url.pathname === '/'
								? 'bg-indigo-600 text-white shadow-sm'
								: 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
						}`}
					>
						<LayoutDashboard class="h-4 w-4" />
						<span>Dashboard</span>
					</a>

					<a
						href="/pegawai"
						onclick={() => isMobileMenuOpen = false}
						class={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
							page.url.pathname.startsWith('/pegawai')
								? 'bg-indigo-600 text-white shadow-sm'
								: 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
						}`}
					>
						<Briefcase class="h-4 w-4" />
						<span>Data Pegawai</span>
					</a>

					<a
						href="/usulan"
						onclick={() => isMobileMenuOpen = false}
						class={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
							page.url.pathname.startsWith('/usulan')
								? 'bg-indigo-600 text-white shadow-sm'
								: 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
						}`}
					>
						<FileText class="h-4 w-4" />
						<span>Usulan Perubahan</span>
					</a>

					{#if authState.isAdmin}
						<a
							href="/verifikasi"
							onclick={() => isMobileMenuOpen = false}
							class={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
								page.url.pathname.startsWith('/verifikasi')
									? 'bg-indigo-600 text-white shadow-sm'
									: 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
							}`}
						>
							<CheckCheck class="h-4 w-4" />
							<span>Verifikasi Usulan</span>
						</a>
					{/if}

					{#if authState.isAdmin}
						<a
							href="/unor"
							onclick={() => isMobileMenuOpen = false}
							class={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
								page.url.pathname.startsWith('/unor')
									? 'bg-indigo-600 text-white shadow-sm'
									: 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
							}`}
						>
							<Building2 class="h-4 w-4" />
							<span>Master UNOR</span>
						</a>
					{/if}

					{#if authState.isAdmin}
						<a
							href="/users"
							onclick={() => isMobileMenuOpen = false}
							class={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
								page.url.pathname.startsWith('/users')
									? 'bg-indigo-600 text-white shadow-sm'
									: 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
							}`}
						>
							<Users class="h-4 w-4" />
							<span>Manajemen Akun</span>
						</a>
					{/if}

					<a
						href="/profile"
						onclick={() => isMobileMenuOpen = false}
						class={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
							page.url.pathname.startsWith('/profile')
								? 'bg-indigo-600 text-white shadow-sm'
								: 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
						}`}
					>
						<User class="h-4 w-4" />
						<span>Profil Akun</span>
					</a>
				</nav>
			</div>

			<!-- User Info & Logout in Sidebar bottom -->
			<div class="border-t border-slate-800/80 pt-4 space-y-3">
				{#if authState.user}
					<div class="flex items-center gap-3 px-2">
						<div class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 border border-slate-700 font-semibold text-xs text-indigo-400">
							{authState.user.username.slice(0, 2).toUpperCase()}
						</div>
						<div class="flex-1 min-w-0">
							<p class="truncate text-sm font-semibold text-white leading-tight">
								{authState.user.username}
							</p>
							<div class="flex items-center gap-1.5 mt-0.5">
								<Badge variant={authState.isAdmin ? 'default' : 'secondary'} class="text-[10px] py-0 px-1.5 font-normal">
									{authState.user.role}
								</Badge>
							</div>
						</div>
					</div>
				{/if}

				<Button
					variant="ghost"
					class="w-full justify-start text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 text-xs h-9"
					onclick={handleLogout}
				>
					<LogOut class="h-3.5 w-3.5" />
					<span>Keluar Sistem</span>
				</Button>
			</div>
		</aside>

		<!-- Main Content Area -->
		<div class="flex-1 flex flex-col min-w-0 overflow-hidden">
			<!-- Desktop Top Header -->
			<header class="relative z-40 hidden md:flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/60 px-8 backdrop-blur-md">
				<div class="flex items-center gap-3">
					<span class="text-xs uppercase tracking-wider font-semibold text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-2.5 py-1 rounded-md">
						RBAC Portal
					</span>
					{#if authState.user?.kodeUnor}
						<span class="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 border border-slate-700/60 px-3 py-1 rounded-md">
							<Building2 class="h-3.5 w-3.5 text-indigo-400 shrink-0" />
							<span>{userUnorName() || 'Memuat Unit...'}</span>
						</span>
					{/if}
				</div>

				<div class="flex items-center gap-4">
					<NotificationBell />
					<div class="h-6 w-px bg-slate-800"></div>
					{#if authState.user}
						<div class="text-right">
							<div class="text-xs font-semibold text-slate-200">{authState.user.username}</div>
							<div class="text-[11px] text-slate-400">
								{authState.user.role === 'Admin' ? 'Admin Pusat' : (userUnorName() || 'Admin OPD')}
							</div>
						</div>
						<div class="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-400">
							{authState.user.username.slice(0, 2).toUpperCase()}
						</div>
					{/if}
				</div>
			</header>

			<!-- Page Body -->
			<main class="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950">
				{@render children()}
			</main>
		</div>
	</div>
{/if}
