<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes, HTMLAnchorAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
	type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

	type Props = {
		variant?: ButtonVariant;
		size?: ButtonSize;
		class?: string;
		children?: Snippet;
		href?: string;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		[key: string]: any;
	};

	let {
		variant = 'default',
		size = 'default',
		class: className = '',
		children,
		type = 'button',
		href,
		...rest
	}: Props = $props();

	const variantStyles: Record<ButtonVariant, string> = {
		default: 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm',
		secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700/60',
		outline: 'border border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800/60 hover:text-white',
		ghost: 'hover:bg-slate-800/60 text-slate-300 hover:text-white',
		destructive: 'bg-rose-600 text-white hover:bg-rose-500 shadow-sm'
	};

	const sizeStyles: Record<ButtonSize, string> = {
		default: 'h-10 px-4 py-2 text-sm',
		sm: 'h-8 px-3 text-xs',
		lg: 'h-11 px-6 text-base',
		icon: 'h-10 w-10 p-0 flex items-center justify-center'
	};
</script>

{#if href}
	<a
		{href}
		class={cn(
			'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none no-underline',
			variantStyles[variant],
			sizeStyles[size],
			className
		)}
		{...rest}
	>
		{#if children}
			{@render children()}
		{/if}
	</a>
{:else}
	<button
		{type}
		class={cn(
			'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
			variantStyles[variant],
			sizeStyles[size],
			className
		)}
		{...rest}
	>
		{#if children}
			{@render children()}
		{/if}
	</button>
{/if}
