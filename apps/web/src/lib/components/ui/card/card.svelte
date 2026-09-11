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
		'rounded-xl border border-slate-800 bg-slate-900/80 text-slate-100 shadow-sm backdrop-blur-sm',
		className
	)}
	{...rest}
>
	{#if children}
		{@render children()}
	{/if}
</div>
