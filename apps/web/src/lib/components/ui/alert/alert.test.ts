import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Alert from './alert.svelte';

describe('Alert Component', () => {
	it('renders with role="alert"', () => {
		render(Alert);
		const alert = screen.getByRole('alert');
		expect(alert).toBeInTheDocument();
	});

	it('applies default variant styles', () => {
		render(Alert);
		const alert = screen.getByRole('alert');
		expect(alert).toHaveClass('bg-slate-100');
		expect(alert).toHaveClass('text-slate-800');
	});

	it('applies destructive variant styles', () => {
		render(Alert, { props: { variant: 'destructive' } });
		const alert = screen.getByRole('alert');
		expect(alert).toHaveClass('border-rose-200');
		expect(alert).toHaveClass('text-rose-800');
	});

	it('applies success and info variant styles', () => {
		const { unmount } = render(Alert, { props: { variant: 'success' } });
		let alert = screen.getByRole('alert');
		expect(alert).toHaveClass('text-emerald-800');
		unmount();

		render(Alert, { props: { variant: 'info' } });
		alert = screen.getByRole('alert');
		expect(alert).toHaveClass('text-indigo-800');
	});

	it('merges custom classes', () => {
		render(Alert, { props: { class: 'mb-4 shadow-lg' } });
		const alert = screen.getByRole('alert');
		expect(alert).toHaveClass('mb-4');
		expect(alert).toHaveClass('shadow-lg');
	});
});

