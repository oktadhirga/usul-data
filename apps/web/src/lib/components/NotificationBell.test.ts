import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import NotificationBell from './NotificationBell.svelte';
import { authState } from '$lib/stores/auth.svelte';
import * as notifApi from '$lib/api/notifications';

vi.mock('$lib/api/notifications', () => ({
	fetchNotifications: vi.fn(),
	markNotificationAsRead: vi.fn(),
	markAllNotificationsAsRead: vi.fn()
}));

describe('NotificationBell Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		authState.user = { id: 'u1', username: 'admin', role: 'ADMIN' } as any;
	});

	it('renders bell button with aria-label', () => {
		vi.mocked(notifApi.fetchNotifications).mockResolvedValue({
			success: true,
			data: [],
			unreadCount: 0
		});

		render(NotificationBell);
		const button = screen.getByRole('button', { name: /Lihat Notifikasi/i });
		expect(button).toBeInTheDocument();
	});

	it('shows badge when unreadCount is greater than 0', async () => {
		vi.mocked(notifApi.fetchNotifications).mockResolvedValue({
			success: true,
			data: [
				{
					id: 'n1',
					userId: 'u1',
					judul: 'Usulan Disetujui',
					pesan: 'Usulan Anda telah disetujui',
					link: '/usulan',
					isRead: false,
					createdAt: new Date().toISOString()
				}
			],
			unreadCount: 1
		});

		render(NotificationBell);

		// Badge with count '1'
		const badge = await screen.findByText('1');
		expect(badge).toBeInTheDocument();
	});

	it('opens dropdown when clicked and lists notification items', async () => {
		const user = userEvent.setup();
		vi.mocked(notifApi.fetchNotifications).mockResolvedValue({
			success: true,
			data: [
				{
					id: 'n1',
					userId: 'u1',
					judul: 'Usulan Disetujui',
					pesan: 'Usulan Anda telah disetujui oleh BKD',
					link: '/usulan',
					isRead: false,
					createdAt: new Date().toISOString()
				}
			],
			unreadCount: 1
		});

		render(NotificationBell);
		const bellButton = screen.getByRole('button', { name: /Lihat Notifikasi/i });

		await user.click(bellButton);

		// Dropdown header & item visible
		expect(screen.getByText('Notifikasi')).toBeInTheDocument();
		expect(screen.getByText('Usulan Disetujui')).toBeInTheDocument();
		expect(screen.getByText('Usulan Anda telah disetujui oleh BKD')).toBeInTheDocument();
	});

	it('handles marking all notifications as read', async () => {
		const user = userEvent.setup();
		vi.mocked(notifApi.fetchNotifications).mockResolvedValue({
			success: true,
			data: [
				{
					id: 'n1',
					userId: 'u1',
					judul: 'Pemberitahuan Baru',
					pesan: 'Isi pemberitahuan',
					link: null,
					isRead: false,
					createdAt: new Date().toISOString()
				}
			],
			unreadCount: 1
		});
		vi.mocked(notifApi.markAllNotificationsAsRead).mockResolvedValue({ success: true } as any);

		render(NotificationBell);
		const bellButton = screen.getByRole('button', { name: /Lihat Notifikasi/i });
		await user.click(bellButton);

		const markAllButton = screen.getByRole('button', { name: /Tandai semua dibaca/i });
		await user.click(markAllButton);

		expect(notifApi.markAllNotificationsAsRead).toHaveBeenCalledTimes(1);
	});
});

