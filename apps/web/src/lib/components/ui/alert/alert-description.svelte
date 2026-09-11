<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	interface Props extends HTMLAttributes<HTMLParagraphElement> {
		class?: string;
		children?: Snippet;
	}

	let { class: className = '', children, ...rest }: Props = $props();
</script>

<div class={cn('text-sm [&_p]:leading-relaxed text-slate-300', className)} {...rest}>
	{#if children}
		{@render children()}
	{/if}
</div>
