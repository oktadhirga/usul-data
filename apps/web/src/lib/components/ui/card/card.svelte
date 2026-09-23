<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		class?: string;
		children?: Snippet;
	}

	let {
		class: className = '',
		children,
		...rest
	}: Props = $props();
</script>

<div
	class={cn(
		'rounded-xl border border-slate-200 bg-white text-slate-900 shadow-xs dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100 backdrop-blur-sm transition-colors',
		className
	)}
	{...rest}
>
	{#if children}
		{@render children()}
	{/if}
</div>
