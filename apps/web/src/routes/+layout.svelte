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
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
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
		X,
		ChevronDown
	} from 'lucide-svelte';

	let { children } = $props();

	let isMobileMenuOpen = $state(false);
	let isUserMenuOpen = $state(false);
	let userMenuRef = $state<HTMLDivElement | null>(null);
	let unorList = $state<UnorItem[]>([]);

	function handleWindowClick(e: MouseEvent) {
		if (isUserMenuOpen && userMenuRef && !userMenuRef.contains(e.target as Node)) {
			isUserMenuOpen = false;
		}
	}

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

<svelte:window onclick={handleWindowClick} />

<svelte:head>
	<title>ASN-Sync - Sistem Pengusulan & Verifikasi Data Pegawai Kab. Trenggalek</title>
	<link rel="icon" href="/logo-trenggalek.svg" />
</svelte:head>

{#if isLoginPage}
	{@render children()}
{:else}
	<div class="h-screen min-h-screen md:min-h-0 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row overflow-hidden transition-colors">
		<!-- Mobile Header -->
		<div class="md:hidden flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-4 py-3 sticky top-0 z-40 backdrop-blur-md">
			<div class="flex items-center gap-2.5 font-bold text-lg text-slate-900 dark:text-white">
				<img
					src="/logo-trenggalek.svg"
					alt="Logo Pemkab Trenggalek"
					class="h-8 w-8 object-contain shrink-0"
				/>
				<div class="leading-tight">
					<div class="text-base font-bold text-slate-900 dark:text-white">ASN-Sync</div>
					<div class="text-[10px] text-slate-500 font-normal">Kab. Trenggalek</div>
				</div>
			</div>
			<div class="flex items-center gap-1.5">
				<ThemeToggle />
				<NotificationBell />
				<button
					type="button"
					class="p-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
					onclick={handleLogout}
					title="Keluar"
					aria-label="Keluar sistem"
				>
					<LogOut class="h-4 w-4" />
				</button>
				<button
					type="button"
					class="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
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
			class={`fixed inset-y-0 left-0 z-50 w-64 md:h-screen md:shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 p-5 flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0 ${
				isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
			}`}
		>
			<div class="space-y-6">
				<!-- Brand Logo -->
				<div class="flex items-center gap-3 px-2 py-1">
					<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1.5 shadow-sm border border-slate-200 dark:border-slate-700/50 shrink-0">
						<img
							src="/logo-trenggalek.svg"
							alt="Logo Kabupaten Trenggalek"
							class="h-full w-full object-contain"
						/>
					</div>
					<div class="min-w-0">
						<h1 class="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none truncate">ASN-Sync</h1>
						<p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate font-medium">Kabupaten Trenggalek</p>
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
								: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
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
								: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
						}`}
					>
						<Briefcase class="h-4 w-4" />
						<span>Data Pegawai</span>
					</a>

					{#if !authState.isVerifikator}
						<a
							href="/usulan"
							onclick={() => isMobileMenuOpen = false}
							class={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
								page.url.pathname.startsWith('/usulan')
									? 'bg-indigo-600 text-white shadow-sm'
									: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
							}`}
						>
							<FileText class="h-4 w-4" />
							<span>Usulan Perubahan</span>
						</a>
					{/if}

					{#if authState.canVerify}
						<a
							href="/verifikasi"
							onclick={() => isMobileMenuOpen = false}
							class={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
								page.url.pathname.startsWith('/verifikasi')
									? 'bg-indigo-600 text-white shadow-sm'
									: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
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
									: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
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
									: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
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
								: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
						}`}
					>
						<User class="h-4 w-4" />
						<span>Profil Akun</span>
					</a>
				</nav>
			</div>
		</aside>

		<!-- Main Content Area -->
		<div class="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
			<!-- Desktop Top Header -->
			<header class="relative z-40 hidden md:flex h-16 shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 px-8 backdrop-blur-md">
				<div class="flex items-center gap-3">
					<span class="text-xs uppercase tracking-wider font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/40 px-2.5 py-1 rounded-md">
						ASN-Sync Portal
					</span>
					{#if authState.user?.kodeUnor}
						<span class="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 px-3 py-1 rounded-md">
							<Building2 class="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
							<span>{userUnorName() || 'Memuat Unit...'}</span>
						</span>
					{/if}
				</div>

				<div class="flex items-center gap-3">
					<ThemeToggle />
					<NotificationBell />
					<div class="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>

					<!-- Direct Quick Logout Button -->
					<Button
						variant="ghost"
						size="sm"
						class="gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-950/40 h-8 px-2.5 cursor-pointer font-medium"
						onclick={handleLogout}
						title="Keluar dari sistem"
					>
						<LogOut class="h-3.5 w-3.5" />
						<span class="hidden lg:inline">Keluar</span>
					</Button>

					{#if authState.user}
						<div class="relative" bind:this={userMenuRef}>
							<button
								type="button"
								class="flex items-center gap-2 p-1 pl-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-indigo-500"
								onclick={() => (isUserMenuOpen = !isUserMenuOpen)}
								aria-expanded={isUserMenuOpen}
							>
								<div class="text-right hidden sm:block">
									<div class="text-xs font-semibold text-slate-900 dark:text-slate-200 leading-tight">
										{authState.user.username}
									</div>
									<div class="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
										{authState.user.role === 'Admin' ? 'Admin Pusat' : authState.user.role === 'Verifikator' ? 'Verifikator Pusat' : (userUnorName() || 'Admin OPD')}
									</div>
								</div>
								<div class="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
									{authState.user.username.slice(0, 2).toUpperCase()}
								</div>
								<ChevronDown class={`h-3.5 w-3.5 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
							</button>

							{#if isUserMenuOpen}
								<div class="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-50">
									<div class="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
										<p class="text-xs font-semibold text-slate-900 dark:text-white truncate">
											{authState.user.username}
										</p>
										<p class="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
											{authState.user.role === 'Admin' ? 'Administrator' : authState.user.role === 'Verifikator' ? 'Verifikator Pusat' : (userUnorName() || 'Pengelola Unit')}
										</p>
										<div class="mt-1.5">
											<Badge variant={authState.isAdmin ? 'default' : 'secondary'} class="text-[9px] py-0 px-1.5 font-normal">
												{authState.user.role}
											</Badge>
										</div>
									</div>

									<div class="py-1">
										<a
											href="/profile"
											class="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
											onclick={() => (isUserMenuOpen = false)}
										>
											<User class="h-3.5 w-3.5 text-slate-400" />
											<span>Profil Akun</span>
										</a>
									</div>

									<div class="border-t border-slate-100 dark:border-slate-800 pt-1">
										<button
											type="button"
											class="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left cursor-pointer"
											onclick={() => {
												isUserMenuOpen = false;
												handleLogout();
											}}
										>
											<LogOut class="h-3.5 w-3.5" />
											<span>Keluar Sistem</span>
										</button>
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</header>

			<!-- Page Body -->
			<main class="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
				{@render children()}
			</main>
		</div>
	</div>
{/if}
