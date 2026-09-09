<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/components/Navbar.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<title>Usul Data - Sistem Kepegawaian & Verifikasi Data</title>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
	<Navbar />
	<main class="flex-1">
		{@render children()}
	</main>
</div>
