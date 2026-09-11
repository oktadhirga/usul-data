<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLTdAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	interface Props extends HTMLTdAttributes {
		class?: string;
		children?: Snippet;
	}

	let { class: className = '', children, ...rest }: Props = $props();
</script>

<td class={cn('p-4 align-middle text-sm text-slate-300', className)} {...rest}>
	{#if children}
		{@render children()}
	{/if}
</td>
