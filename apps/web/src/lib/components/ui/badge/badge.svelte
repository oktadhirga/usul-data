<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		variant?: BadgeVariant;
		class?: string;
		children?: Snippet;
	}

	let {
		variant = 'default',
		class: className = '',
		children,
		...rest
	}: Props = $props();

	const variantStyles: Record<BadgeVariant, string> = {
		default: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
		secondary: 'bg-slate-800 text-slate-300 border-slate-700',
		destructive: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
		outline: 'text-slate-300 border-slate-700',
		success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
	};
</script>

<div
	class={cn(
		'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
		variantStyles[variant],
		className
	)}
	{...rest}
>
	{#if children}
		{@render children()}
	{/if}
</div>
