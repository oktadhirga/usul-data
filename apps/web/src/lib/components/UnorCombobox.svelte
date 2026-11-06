<script lang="ts">
	import type { UnorItem } from '$lib/api/pegawai';
	import { Building2, ChevronsUpDown, Check, Search, X } from 'lucide-svelte';
	import { cn } from '$lib/utils';

	interface Props {
		unors?: UnorItem[];
		value?: string;
		placeholder?: string;
		allOptionLabel?: string;
		allValue?: string;
		disabled?: boolean;
		allowClear?: boolean;
		class?: string;
		size?: 'sm' | 'default';
		id?: string;
		name?: string;
		required?: boolean;
		onchange?: (val: string) => void;
	}

	let {
		unors = [],
		value = $bindable(''),
		placeholder = 'Pilih Unit Organisasi...',
		allOptionLabel = '',
		allValue = '',
		disabled = false,
		allowClear = false,
		class: className = '',
		size = 'default',
		id,
		name,
		required = false,
		onchange
	}: Props = $props();

	let isOpen = $state(false);
	let search = $state('');
	let containerRef = $state<HTMLDivElement | null>(null);
	let searchInputRef = $state<HTMLInputElement | null>(null);

	const isAllSelected = $derived(allOptionLabel ? value === allValue : false);

	const selectedLabel = $derived(() => {
		if (allOptionLabel && (value === allValue || (!value && allValue === ''))) {
			return allOptionLabel;
		}
		if (!value) return placeholder;
		const found = unors.find((u) => u.kodeUnor === value);
		return found ? found.namaUnor : value;
	});

	const filteredUnors = $derived(
		unors.filter((u) => {
			const q = search.trim().toLowerCase();
			if (!q) return true;
			return (
				u.namaUnor.toLowerCase().includes(q) ||
				u.kodeUnor.toLowerCase().includes(q)
			);
		})
	);

	function toggleDropdown() {
		if (disabled) return;
		isOpen = !isOpen;
		if (isOpen) {
			search = '';
			setTimeout(() => {
				searchInputRef?.focus();
			}, 50);
		}
	}

	function selectItem(val: string) {
		value = val;
		isOpen = false;
		if (onchange) onchange(val);
	}

	function handleClear(e: MouseEvent) {
		e.stopPropagation();
		const resetVal = allOptionLabel ? allValue : '';
		value = resetVal;
		isOpen = false;
		if (onchange) onchange(resetVal);
	}

	function handleWindowClick(e: MouseEvent) {
		if (isOpen && containerRef && !containerRef.contains(e.target as Node)) {
			isOpen = false;
		}
	}

	function handleWindowKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isOpen) {
			isOpen = false;
		}
	}
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

<div class="relative w-full" bind:this={containerRef}>
	<!-- Hidden input for standard form submission if needed -->
	{#if name}
		<input type="hidden" {name} {value} {required} />
	{/if}

	<!-- Trigger Button -->
	<button
		{id}
		type="button"
		{disabled}
		class={cn(
			'w-full text-left rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 flex items-center justify-between transition-colors shadow-2xs hover:border-slate-400 dark:hover:border-slate-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
			size === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-10 px-3 text-xs',
			className
		)}
		onclick={toggleDropdown}
		aria-expanded={isOpen}
	>
		<div class="flex items-center gap-2 min-w-0 flex-1 pr-1">
			<Building2 class="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
			<span class="truncate block font-medium {value ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}">
				{selectedLabel()}
			</span>
		</div>

		<div class="flex items-center gap-1 shrink-0 ml-1">
			{#if (allowClear || allOptionLabel) && value && value !== allValue}
				<button
					type="button"
					class="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
					onclick={handleClear}
					title="Hapus pilihan"
				>
					<X class="h-3 w-3" />
				</button>
			{/if}
			<ChevronsUpDown class="h-3.5 w-3.5 text-slate-400 shrink-0" />
		</div>
	</button>

	<!-- Searchable Dropdown Popover -->
	{#if isOpen}
		<div class="absolute left-0 top-full mt-1.5 w-full min-w-[280px] sm:w-96 max-w-[95vw] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
			<!-- Search Header -->
			<div class="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 relative">
				<Search class="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
				<input
					bind:this={searchInputRef}
					type="text"
					placeholder="Ketik untuk mencari unit kerja..."
					class="w-full h-8 pl-8 pr-7 text-xs rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
					bind:value={search}
				/>
				{#if search}
					<button
						type="button"
						class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
						onclick={() => (search = '')}
					>
						<X class="h-3 w-3" />
					</button>
				{/if}
			</div>

			<!-- Options List -->
			<div class="max-h-60 overflow-y-auto p-1.5 space-y-0.5 text-xs">
				<!-- Optional 'All' Option for filters -->
				{#if allOptionLabel}
					<button
						type="button"
						class="w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition-colors cursor-pointer {isAllSelected ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'}"
						onclick={() => selectItem(allValue)}
					>
						<span class="flex items-center gap-2">
							<Building2 class="h-3.5 w-3.5 opacity-60" />
							<span>{allOptionLabel}</span>
						</span>
						{#if isAllSelected}
							<Check class="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
						{/if}
					</button>
				{/if}

				<!-- Filtered UNOR Items -->
				{#each filteredUnors as u}
					{@const isSelected = value === u.kodeUnor}
					<button
						type="button"
						class="w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between gap-2 transition-colors cursor-pointer {isSelected ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'}"
						onclick={() => selectItem(u.kodeUnor)}
					>
						<div class="flex flex-col min-w-0 pr-1">
							<span class="truncate leading-snug">{u.namaUnor}</span>
							<span class="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">{u.kodeUnor}</span>
						</div>
						{#if isSelected}
							<Check class="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
						{/if}
					</button>
				{/each}

				{#if filteredUnors.length === 0}
					<div class="py-6 text-center text-slate-400 dark:text-slate-500 text-xs">
						Tidak ada unit kerja cocok dengan "{search}"
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
