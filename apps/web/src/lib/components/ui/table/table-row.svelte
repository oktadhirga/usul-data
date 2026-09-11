<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	interface Props extends HTMLAttributes<HTMLTableRowElement> {
		class?: string;
		children?: Snippet;
	}

	let { class: className = '', children, ...rest }: Props = $props();
</script>

<tr class={cn('transition-colors hover:bg-slate-800/40 data-[state=selected]:bg-slate-800', className)} {...rest}>
	{#if children}
		{@render children()}
	{/if}
</tr>
