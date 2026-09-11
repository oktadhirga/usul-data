<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	interface Props extends HTMLAttributes<HTMLTableSectionElement> {
		class?: string;
		children?: Snippet;
	}

	let { class: className = '', children, ...rest }: Props = $props();
</script>

<thead class={cn('bg-slate-900/90 border-b border-slate-800 text-slate-400', className)} {...rest}>
	{#if children}
		{@render children()}
	{/if}
</thead>
