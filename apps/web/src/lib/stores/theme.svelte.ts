export type Theme = 'light' | 'dark';

class ThemeStore {
	current = $state<Theme>('light');

	constructor() {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('theme') as Theme | null;
			if (saved === 'dark' || saved === 'light') {
				this.current = saved;
			} else {
				this.current = 'light';
			}
			this.apply();
		}
	}

	setTheme(theme: Theme) {
		this.current = theme;
		if (typeof window !== 'undefined') {
			localStorage.setItem('theme', theme);
			this.apply();
		}
	}

	toggleTheme() {
		this.setTheme(this.current === 'dark' ? 'light' : 'dark');
	}

	private apply() {
		if (typeof document !== 'undefined') {
			if (this.current === 'dark') {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
		}
	}
}

export const themeState = new ThemeStore();
