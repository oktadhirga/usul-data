<script lang="ts">
	import { themeState } from '$lib/stores/theme.svelte';
	import { Sun, Moon } from 'lucide-svelte';

	let { class: className = '' }: { class?: string } = $props();
</script>

<button
	type="button"
	class="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer {className}"
	onclick={() => themeState.toggleTheme()}
	aria-label={themeState.current === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
	title={themeState.current === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
>
	{#if themeState.current === 'dark'}
		<Sun class="h-4 w-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
	{:else}
		<Moon class="h-4 w-4 text-slate-700 transition-transform duration-200 hover:-rotate-12" />
	{/if}
</button>
