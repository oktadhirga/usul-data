import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Button from './button.svelte';

describe('Button Component', () => {
	it('renders as button element with default attributes', () => {
		render(Button);
		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
		expect(button).toHaveAttribute('type', 'button');
	});

	it('renders as an anchor when href prop is provided', () => {
		render(Button, { props: { href: '/dashboard' } });
		const link = screen.getByRole('link');
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute('href', '/dashboard');
	});

	it('applies variant classes correctly', () => {
		const { container } = render(Button, { props: { variant: 'destructive' } });
		const button = container.querySelector('button');
		expect(button).toHaveClass('bg-rose-600');
	});

	it('applies size classes correctly', () => {
		const { container } = render(Button, { props: { size: 'sm' } });
		const button = container.querySelector('button');
		expect(button).toHaveClass('h-8');
	});

	it('handles click events when enabled', async () => {
		const user = userEvent.setup();
		const handleClick = vi.fn();

		render(Button, { props: { onclick: handleClick } });
		const button = screen.getByRole('button');

		await user.click(button);
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('does not trigger click events when disabled', async () => {
		const user = userEvent.setup();
		const handleClick = vi.fn();

		render(Button, { props: { disabled: true, onclick: handleClick } });
		const button = screen.getByRole('button');
		expect(button).toBeDisabled();

		await user.click(button);
		expect(handleClick).not.toHaveBeenCalled();
	});
});

