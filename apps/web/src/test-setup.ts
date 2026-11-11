import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/svelte';
import { afterEach, vi } from 'vitest';

// Automatically cleanup rendered components after each test
afterEach(() => {
	cleanup();
});

// Mock SvelteKit runtime modules
vi.mock('$app/environment', () => ({
	browser: true,
	dev: true,
	building: false,
	version: 'any'
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidate: vi.fn(),
	invalidateAll: vi.fn(),
	preloadData: vi.fn(),
	preloadCode: vi.fn(),
	beforeNavigate: vi.fn(),
	afterNavigate: vi.fn(),
	pushState: vi.fn(),
	replaceState: vi.fn()
}));

vi.mock('$app/stores', async () => {
	const { readable, writable } = await import('svelte/store');
	const page = writable({
		url: new URL('http://localhost:5173'),
		params: {},
		route: { id: null },
		status: 200,
		error: null,
		data: {},
		form: null
	});

	const navigating = readable(null);
	const updated = {
		subscribe: readable(false).subscribe,
		check: vi.fn()
	};

	return {
		getStores: () => ({ page, navigating, updated }),
		page,
		navigating,
		updated
	};
});

