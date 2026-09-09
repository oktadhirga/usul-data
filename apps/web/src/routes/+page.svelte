<script lang="ts">
	const features = [
		{
			title: 'Fitur Data Kepegawaian (Issue #4)',
			badge: 'Baru!',
			desc: 'Manajemen aparatur sipil negara per Unit Organisasi (UNOR) dengan kontrol RBAC scoping ketat dan halaman profil pegawai.',
			link: '/pegawai',
			cta: 'Buka Daftar Pegawai →'
		},
		{
			title: 'Master Unit Organisasi (UNOR)',
			badge: 'Master',
			desc: 'Pengelolaan data unit organisasi induk dan perangkat daerah untuk klasifikasi pegawai pemerintah.',
			link: '/unor',
			cta: 'Lihat Master UNOR →'
		},
		{
			title: 'Autentikasi & RBAC (Issue #2)',
			badge: 'Auth',
			desc: 'Sistem login berbasis JWT, role guard Admin & AdminOPD, serta middleware scoping otomatis resolveUnorScope.',
			link: 'http://localhost:3000/health',
			cta: 'Cek API Backend →'
		},
		{
			title: 'Drizzle ORM & MySQL',
			badge: 'Database',
			desc: 'Skema relasional otomatis, type-safe migrations, dan foreign key cascade antara unor dan pegawai.',
			link: 'https://github.com/oktadhirga/usul-data/issues/4',
			cta: 'GitHub Issue #4 →'
		}
	];
</script>

<div class="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-12">
	<!-- Hero Section -->
	<div class="text-center space-y-4 max-w-3xl mx-auto">
		<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 shadow-sm">
			<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
			Modul Data Kepegawaian Aktif
		</div>
		<h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
			Sistem Pengelolaan <span class="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Data Kepegawaian</span>
		</h1>
		<p class="text-slate-400 text-base sm:text-lg">
			Platform type-safe terintegrasi untuk pengelolaan data aparatur sipil per Unit Organisasi (UNOR), verifikasi usul data, dan pembatasan wewenang berjenjang.
		</p>

		<div class="flex flex-wrap items-center justify-center gap-4 pt-3">
			<a
				href="/pegawai"
				class="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm text-white transition shadow-lg shadow-indigo-600/30 flex items-center gap-2"
			>
				<span>Jelajahi Data Pegawai</span>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
				</svg>
			</a>
			<a
				href="/unor"
				class="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 font-semibold text-sm text-slate-200 border border-slate-800 transition"
			>
				Daftar Master UNOR
			</a>
		</div>
	</div>

	<!-- Features Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
		{#each features as f}
			<div class="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition shadow-sm space-y-3 flex flex-col justify-between">
				<div>
					<div class="flex items-center justify-between mb-2">
						<h3 class="font-bold text-slate-100 text-lg">{f.title}</h3>
						<span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-950 text-indigo-400 border border-indigo-800">
							{f.badge}
						</span>
					</div>
					<p class="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
				</div>
				<div class="pt-2 border-t border-slate-800/80">
					<a
						href={f.link}
						class="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 transition"
					>
						{f.cta}
					</a>
				</div>
			</div>
		{/each}
	</div>
</div>
