<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLTableAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	interface Props extends HTMLTableAttributes {
		class?: string;
		children?: Snippet;
	}

	let { class: className = '', children, ...rest }: Props = $props();
</script>

<div class="relative w-full overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
	<table class={cn('w-full caption-bottom text-sm text-slate-800 dark:text-slate-200', className)} {...rest}>
		{#if children}
			{@render children()}
		{/if}
	</table>
</div>
