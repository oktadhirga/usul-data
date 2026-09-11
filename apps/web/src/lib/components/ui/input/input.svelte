<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	interface Props extends HTMLInputAttributes {
		class?: string;
		value?: string | number | null;
	}

	let {
		class: className = '',
		value = $bindable(''),
		type = 'text',
		...rest
	}: Props = $props();
</script>

<input
	{type}
	bind:value
	class={cn(
		'flex h-10 w-full rounded-lg border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
		className
	)}
	{...rest}
/>
