<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLThAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	interface Props extends HTMLThAttributes {
		class?: string;
		children?: Snippet;
	}

	let { class: className = '', children, ...rest }: Props = $props();
</script>

<th class={cn('h-11 px-4 text-left align-middle font-medium text-xs uppercase tracking-wider text-slate-400', className)} {...rest}>
	{#if children}
		{@render children()}
	{/if}
</th>
