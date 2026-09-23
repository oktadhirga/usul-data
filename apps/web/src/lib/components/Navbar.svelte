<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { DEMO_USERS, getActiveUser, setActiveUser } from '$lib/api';
	import type { UserProfile } from '$lib/types/kepegawaian';

	let activeUser = $state<UserProfile>(DEMO_USERS[0]);
	let isDropdownOpen = $state(false);

	onMount(() => {
		activeUser = getActiveUser();

		const handleUserChange = () => {
			activeUser = getActiveUser();
		};

		window.addEventListener('user-changed', handleUserChange);
		return () => {
			window.removeEventListener('user-changed', handleUserChange);
		};
	});

	function handleSwitchUser(user: UserProfile) {
		activeUser = user;
		setActiveUser(user);
		isDropdownOpen = false;
	}
</script>

<header class="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
		<!-- Brand & Nav Links -->
		<div class="flex items-center gap-8">
			<a href="/" class="flex items-center gap-2 group">
				<div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform tracking-wider text-xs">
					AS
				</div>
				<span class="font-bold text-lg text-white tracking-tight group-hover:text-indigo-300 transition-colors">
					ASN-Sync
				</span>
				<span class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono">
					v1.0
				</span>
			</a>

			<nav class="hidden md:flex items-center gap-1">
				<a
					href="/"
					class="px-3 py-1.5 rounded-lg text-sm font-medium transition {page.url.pathname === '/' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'}"
				>
					Beranda
				</a>
				<a
					href="/pegawai"
					class="px-3 py-1.5 rounded-lg text-sm font-medium transition {page.url.pathname.startsWith('/pegawai') ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'}"
				>
					Data Pegawai
				</a>
				<a
					href="/unor"
					class="px-3 py-1.5 rounded-lg text-sm font-medium transition {page.url.pathname.startsWith('/unor') ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'}"
				>
					Unit Organisasi (UNOR)
				</a>
			</nav>
		</div>

		<!-- User Simulation Switcher -->
		<div class="relative flex items-center gap-3">
			<div class="hidden sm:flex flex-col items-end text-xs">
				<span class="text-slate-400 font-medium">Simulasi Role:</span>
				<span class="text-slate-200 font-semibold">{activeUser.username}</span>
			</div>

			<button
				type="button"
				id="user-menu-btn"
				class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
				onclick={() => (isDropdownOpen = !isDropdownOpen)}
			>
				{#if activeUser.role === 'Admin'}
					<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
					<span class="text-emerald-300 font-semibold">Admin Pusat</span>
				{:else}
					<span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
					<span class="text-amber-300 font-semibold">Admin OPD ({activeUser.kodeUnor?.replace('UNOR-', '')})</span>
				{/if}
				<svg class="w-3.5 h-3.5 text-slate-400 ml-1 transition-transform {isDropdownOpen ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			{#if isDropdownOpen}
				<div class="absolute right-0 top-12 w-64 rounded-xl bg-slate-900/95 border border-slate-800 shadow-2xl p-2 z-50 backdrop-blur-xl text-xs space-y-1">
					<div class="px-2 py-1.5 text-slate-400 font-semibold border-b border-slate-800/80 mb-1">
						Pilih Akun Simulasi RBAC
					</div>
					{#each DEMO_USERS as user}
						<button
							type="button"
							class="w-full text-left px-2.5 py-2 rounded-lg flex flex-col transition cursor-pointer {activeUser.username === user.username ? 'bg-indigo-950/60 border border-indigo-700/50 text-indigo-200' : 'hover:bg-slate-800/60 text-slate-300'}"
							onclick={() => handleSwitchUser(user)}
						>
							<div class="flex items-center justify-between w-full">
								<span class="font-semibold">{user.username}</span>
								<span class="px-1.5 py-0.5 rounded text-[10px] {user.role === 'Admin' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}">
									{user.role}
								</span>
							</div>
							<span class="text-[11px] text-slate-400 mt-0.5">
								{user.kodeUnor ? `Scope: ${user.kodeUnor}` : 'Scope: Seluruh Unit (Pusat)'}
							</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</header>
