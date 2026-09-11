<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	type AlertVariant = 'default' | 'destructive' | 'success' | 'info';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		variant?: AlertVariant;
		class?: string;
		children?: Snippet;
	}

	let {
		variant = 'default',
		class: className = '',
		children,
		...rest
	}: Props = $props();

	const variantStyles: Record<AlertVariant, string> = {
		default: 'bg-slate-900 border-slate-800 text-slate-200',
		destructive: 'border-rose-900/50 bg-rose-950/40 text-rose-300 [&>svg]:text-rose-400',
		success: 'border-emerald-900/50 bg-emerald-950/40 text-emerald-300 [&>svg]:text-emerald-400',
		info: 'border-indigo-900/50 bg-indigo-950/40 text-indigo-300 [&>svg]:text-indigo-400'
	};
</script>

<div
	role="alert"
	class={cn(
		'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4',
		variantStyles[variant],
		className
	)}
	{...rest}
>
	{#if children}
		{@render children()}
	{/if}
</div>
