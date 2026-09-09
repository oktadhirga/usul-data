<script lang="ts">
	const features = [
		{ title: 'Bun Workspaces', desc: 'Monorepo setup with apps/api, apps/web, and packages/shared.' },
		{ title: 'ElysiaJS Backend', desc: 'Fast, type-safe API with modular routes, services, and middlewares.' },
		{ title: 'SvelteKit + Tailwind CSS', desc: 'Modern reactive frontend styled with Tailwind CSS.' },
		{ title: 'MySQL + Drizzle ORM', desc: 'Type-safe SQL schemas, query builder, and automatic migration scripts.' },
		{ title: 'GitHub Actions CI', desc: 'Automated linting, type-checking, and testing.' }
	];
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
	<div class="max-w-3xl w-full space-y-8">
		<div class="text-center space-y-3">
			<span class="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 rounded-full">
				Monorepo Stack
			</span>
			<h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl text-white">
				Usul Data Monorepo
			</h1>
			<p class="text-slate-400 text-lg">
				SvelteKit, Elysia, Drizzle ORM, and Bun workspaces are ready.
			</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			{#each features as f}
				<div class="p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition shadow-sm">
					<h3 class="font-semibold text-slate-200 text-base">{f.title}</h3>
					<p class="mt-1 text-sm text-slate-400">{f.desc}</p>
				</div>
			{/each}
		</div>

		<div class="flex items-center justify-center gap-4 pt-4">
			<a
				href="http://localhost:3000/health"
				target="_blank"
				rel="noreferrer"
				class="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-medium text-sm text-white transition shadow"
			>
				Check API Health (Port 3000)
			</a>
			<a
				href="https://github.com/oktadhirga/usul-data/issues/1"
				target="_blank"
				rel="noreferrer"
				class="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 font-medium text-sm text-slate-300 border border-slate-700 transition"
			>
				GitHub Issue #1
			</a>
		</div>
	</div>
</div>
