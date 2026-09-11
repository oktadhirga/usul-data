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

<tbody class={cn('[&_tr:last-child]:border-0 divide-y divide-slate-800/60', className)} {...rest}>
	{#if children}
		{@render children()}
	{/if}
</tbody>
