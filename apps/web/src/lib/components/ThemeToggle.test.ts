import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ThemeToggle from './ThemeToggle.svelte';
import { themeState } from '$lib/stores/theme.svelte';

describe('ThemeToggle Component', () => {
	beforeEach(() => {
		// Reset to light theme before each test
		themeState.setTheme('light');
	});

	it('renders theme toggle button with initial light state', () => {
		render(ThemeToggle);
		const button = screen.getByRole('button', { name: /Ganti ke Mode Gelap/i });
		expect(button).toBeInTheDocument();
		expect(themeState.current).toBe('light');
	});

	it('toggles theme between light and dark when clicked', async () => {
		const user = userEvent.setup();
		render(ThemeToggle);
		const button = screen.getByRole('button');

		// Toggle to dark
		await user.click(button);
		expect(themeState.current).toBe('dark');
		expect(button).toHaveAttribute('aria-label', 'Ganti ke Mode Terang');

		// Toggle back to light
		await user.click(button);
		expect(themeState.current).toBe('light');
		expect(button).toHaveAttribute('aria-label', 'Ganti ke Mode Gelap');
	});

	it('merges custom class names', () => {
		render(ThemeToggle, { props: { class: 'custom-toggle-class' } });
		const button = screen.getByRole('button');
		expect(button).toHaveClass('custom-toggle-class');
	});
});

