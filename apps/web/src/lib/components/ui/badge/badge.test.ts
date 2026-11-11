import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Badge from './badge.svelte';

describe('Badge Component', () => {
	it('renders default badge styles', () => {
		const { container } = render(Badge);
		const badge = container.querySelector('div');
		expect(badge).toBeInTheDocument();
		expect(badge).toHaveClass('bg-indigo-50');
		expect(badge).toHaveClass('text-indigo-700');
	});

	it('renders success variant', () => {
		const { container } = render(Badge, { props: { variant: 'success' } });
		const badge = container.querySelector('div');
		expect(badge).toHaveClass('bg-emerald-50');
		expect(badge).toHaveClass('text-emerald-700');
	});

	it('renders destructive variant', () => {
		const { container } = render(Badge, { props: { variant: 'destructive' } });
		const badge = container.querySelector('div');
		expect(badge).toHaveClass('bg-rose-50');
		expect(badge).toHaveClass('text-rose-700');
	});

	it('merges custom classes', () => {
		const { container } = render(Badge, { props: { class: 'custom-badge-class' } });
		const badge = container.querySelector('div');
		expect(badge).toHaveClass('custom-badge-class');
	});
});

