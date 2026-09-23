<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authState } from '$lib/stores/auth.svelte';
	import {
		fetchNotifications,
		markNotificationAsRead,
		markAllNotificationsAsRead,
		type NotificationItem
	} from '$lib/api/notifications';
	import { Bell, Check, ExternalLink } from 'lucide-svelte';

	let isOpen = $state(false);
	let notifications = $state<NotificationItem[]>([]);
	let unreadCount = $state(0);
	let loading = $state(false);
	let containerRef = $state<HTMLDivElement | null>(null);

	function handleWindowClick(e: MouseEvent) {
		if (isOpen && containerRef && !containerRef.contains(e.target as Node)) {
			isOpen = false;
		}
	}

	async function loadData() {
		if (!authState.isAuthenticated) return;
		loading = true;
		const res = await fetchNotifications();
		if (res.success) {
			notifications = res.data;
			unreadCount = res.unreadCount;
		}
		loading = false;
	}

	onMount(() => {
		loadData();
	});

	// Trigger reload jika user berubah atau komponen mounted
	$effect(() => {
		if (authState.isAuthenticated) {
			loadData();
		}
	});

	async function handleItemClick(item: NotificationItem) {
		if (!item.isRead) {
			await markNotificationAsRead(item.id);
			item.isRead = true;
			unreadCount = Math.max(0, unreadCount - 1);
		}
		isOpen = false;
		if (item.link) {
			goto(item.link);
		}
	}

	async function handleMarkAll() {
		await markAllNotificationsAsRead();
		notifications = notifications.map((n) => ({ ...n, isRead: true }));
		unreadCount = 0;
	}

	function formatTime(dateStr: string): string {
		try {
			const d = new Date(dateStr);
			return d.toLocaleString('id-ID', {
				day: 'numeric',
				month: 'short',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return dateStr;
		}
	}
</script>

<svelte:window onclick={handleWindowClick} />

<div class="relative {isOpen ? 'z-50' : ''}" bind:this={containerRef}>
	<button
		type="button"
		class="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
		onclick={(e) => {
			e.stopPropagation();
			isOpen = !isOpen;
			if (isOpen) loadData();
		}}
		aria-label="Lihat Notifikasi"
	>
		<Bell class="h-5 w-5" />
		{#if unreadCount > 0}
			<span
				class="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-in fade-in zoom-in-75 duration-200"
			>
				{unreadCount > 99 ? '99+' : unreadCount}
			</span>
		{/if}
	</button>

	{#if isOpen}
		<!-- Dropdown Card -->
		<div
			class="absolute right-0 mt-2 z-50 w-80 md:w-96 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-950/10 dark:shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 px-4 py-3 bg-slate-50/80 dark:bg-slate-900/90">
				<div class="flex items-center gap-2">
					<span class="font-semibold text-sm text-slate-900 dark:text-white">Notifikasi</span>
					{#if unreadCount > 0}
						<span class="rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 px-2 py-0.5 text-xs font-medium">
							{unreadCount} baru
						</span>
					{/if}
				</div>
				{#if unreadCount > 0}
					<button
						type="button"
						class="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
						onclick={handleMarkAll}
					>
						<Check class="h-3 w-3" />
						<span>Tandai semua dibaca</span>
					</button>
				{/if}
			</div>

			<!-- List -->
			<div class="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
				{#if loading && notifications.length === 0}
					<div class="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
						Memuat notifikasi...
					</div>
				{:else if notifications.length === 0}
					<div class="p-8 text-center">
						<Bell class="mx-auto h-8 w-8 text-slate-400 dark:text-slate-600 mb-2 opacity-50" />
						<p class="text-xs text-slate-500 dark:text-slate-400">Belum ada notifikasi</p>
					</div>
				{:else}
					{#each notifications as item (item.id)}
						<button
							type="button"
							class="w-full text-left p-3.5 transition-colors flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer {item.isRead ? 'opacity-70 bg-transparent' : 'bg-indigo-50/40 dark:bg-indigo-950/20'}"
							onclick={() => handleItemClick(item)}
						>
							<div class="pt-1 shrink-0">
								{#if !item.isRead}
									<span class="block h-2 w-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50"></span>
								{:else}
									<span class="block h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600"></span>
								{/if}
							</div>
							<div class="flex-1 min-w-0">
								<div class="flex items-center justify-between gap-1 mb-0.5">
									<h4 class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{item.judul}</h4>
									<span class="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">{formatTime(item.createdAt)}</span>
								</div>
								<p class="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 break-words leading-relaxed">{item.pesan}</p>
								{#if item.link}
									<div class="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
										<span>Lihat rincian</span>
										<ExternalLink class="h-2.5 w-2.5" />
									</div>
								{/if}
							</div>
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
