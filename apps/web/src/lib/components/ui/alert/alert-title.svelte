<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	interface Props extends HTMLAttributes<HTMLHeadingElement> {
		class?: string;
		children?: Snippet;
	}

	let { class: className = '', children, ...rest }: Props = $props();
</script>

<h5 class={cn('mb-1 font-medium leading-none tracking-tight text-slate-900 dark:text-white', className)} {...rest}>
	{#if children}
		{@render children()}
	{/if}
</h5>
