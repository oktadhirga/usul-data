<script lang="ts">
	import type { Snippet } from 'svelte';
	import { X } from 'lucide-svelte';
	import { cn } from '$lib/utils';

	interface Props {
		open?: boolean;
		title?: string;
		description?: string;
		class?: string;
		children?: Snippet;
		footer?: Snippet;
		onclose?: () => void;
	}

	let {
		open = $bindable(false),
		title = '',
		description = '',
		class: className = '',
		children,
		footer,
		onclose
	}: Props = $props();

	function close() {
		open = false;
		if (onclose) onclose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			close();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
		role="dialog"
		aria-modal="true"
	>
		<!-- Backdrop -->
		<button
			type="button"
			class="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity cursor-default border-none p-0 w-full h-full"
			onclick={close}
			aria-label="Tutup dialog"
		></button>

		<!-- Modal Container -->
		<div
			class={cn(
				'relative z-50 w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl transition-all sm:my-8 text-slate-100',
				className
			)}
		>
			<!-- Close Button -->
			<button
				type="button"
				class="absolute right-4 top-4 rounded-md p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
				onclick={close}
				aria-label="Close"
			>
				<X class="h-4 w-4" />
			</button>

			<!-- Header -->
			{#if title || description}
				<div class="flex flex-col space-y-1.5 text-left mb-5 pr-6">
					{#if title}
						<h2 class="text-lg font-semibold text-white tracking-tight">{title}</h2>
					{/if}
					{#if description}
						<p class="text-sm text-slate-400">{description}</p>
					{/if}
				</div>
			{/if}

			<!-- Body -->
			<div class="space-y-4">
				{#if children}
					{@render children()}
				{/if}
			</div>

			<!-- Footer -->
			{#if footer}
				<div class="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
