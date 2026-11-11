import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Input from './input.svelte';

describe('Input Component', () => {
	it('renders with default attributes', () => {
		render(Input, { props: { placeholder: 'Masukkan nama' } });
		const input = screen.getByPlaceholderText('Masukkan nama');
		expect(input).toBeInTheDocument();
		expect(input).toHaveAttribute('type', 'text');
	});

	it('accepts custom type and value', () => {
		render(Input, { props: { type: 'password', value: 'secret123' } });
		const input = screen.getByDisplayValue('secret123');
		expect(input).toHaveAttribute('type', 'password');
	});

	it('allows user input typing', async () => {
		const user = userEvent.setup();
		render(Input, { props: { placeholder: 'Cari pegawai...' } });
		const input = screen.getByPlaceholderText('Cari pegawai...');

		await user.type(input, 'Budi');
		expect(input).toHaveValue('Budi');
	});

	it('renders in disabled state when disabled prop is passed', () => {
		render(Input, { props: { disabled: true, placeholder: 'Terkunci' } });
		const input = screen.getByPlaceholderText('Terkunci');
		expect(input).toBeDisabled();
	});

	it('merges custom class names correctly', () => {
		render(Input, { props: { class: 'custom-border', placeholder: 'Kustom' } });
		const input = screen.getByPlaceholderText('Kustom');
		expect(input).toHaveClass('custom-border');
	});
});

