export interface CurrentUser {
	id: number;
	username: string;
	role: 'Admin' | 'AdminOPD';
	kodeUnor?: string | null;
}

class AuthStore {
	user = $state<CurrentUser | null>(null);
	token = $state<string | null>(null);
	isLoading = $state<boolean>(true);
	isInitialized = $state<boolean>(false);

	get isAuthenticated(): boolean {
		return !!this.user;
	}

	get isAdmin(): boolean {
		return this.user?.role === 'Admin';
	}

	constructor() {
		if (typeof window !== 'undefined') {
			const savedToken = localStorage.getItem('usul_auth_token');
			const savedUser = localStorage.getItem('usul_auth_user');
			if (savedToken) {
				this.token = savedToken;
			}
			if (savedUser) {
				try {
					this.user = JSON.parse(savedUser);
				} catch {
					this.user = null;
				}
			}
			this.init();
		}
	}

	async init() {
		try {
			const headers: Record<string, string> = {};
			if (this.token) {
				headers['Authorization'] = `Bearer ${this.token}`;
			}
			const res = await fetch('/api/auth/me', {
				headers,
				credentials: 'include'
			});
			if (res.ok) {
				const data = await res.json();
				if (data.success && data.user) {
					this.user = data.user;
					localStorage.setItem('usul_auth_user', JSON.stringify(data.user));
				}
			} else if (res.status === 401) {
				this.user = null;
				this.token = null;
				localStorage.removeItem('usul_auth_token');
				localStorage.removeItem('usul_auth_user');
			}
		} catch (e) {
			console.error('Auth verification failed:', e);
		} finally {
			this.isLoading = false;
			this.isInitialized = true;
		}
	}

	async login(username: string, password: string):Promise<{ success: boolean; message?: string }> {
		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password }),
				credentials: 'include'
			});
			const data = await res.json();
			if (!res.ok || !data.success) {
				return {
					success: false,
					message: data.message || 'Login gagal. Periksa username dan password Anda.'
				};
			}

			this.token = data.token;
			this.user = data.user;
			localStorage.setItem('usul_auth_token', data.token);
			localStorage.setItem('usul_auth_user', JSON.stringify(data.user));
			return { success: true };
		} catch (err: any) {
			return {
				success: false,
				message: err.message || 'Gagal menghubungi server'
			};
		}
	}

	async logout(): Promise<void> {
		try {
			await fetch('/api/auth/logout', {
				method: 'POST',
				credentials: 'include'
			});
		} catch (e) {
			console.error('Logout error:', e);
		} finally {
			this.user = null;
			this.token = null;
			if (typeof window !== 'undefined') {
				localStorage.removeItem('usul_auth_token');
				localStorage.removeItem('usul_auth_user');
			}
		}
	}

	async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
		try {
			const headers: Record<string, string> = {
				'Content-Type': 'application/json'
			};
			if (this.token) {
				headers['Authorization'] = `Bearer ${this.token}`;
			}
			const res = await fetch('/api/auth/change-password', {
				method: 'POST',
				headers,
				body: JSON.stringify({ oldPassword, newPassword }),
				credentials: 'include'
			});
			const data = await res.json();
			if (!res.ok || !data.success) {
				return {
					success: false,
					message: data.message || 'Gagal mengubah password'
				};
			}
			return { success: true, message: data.message || 'Password berhasil diperbarui' };
		} catch (err: any) {
			return {
				success: false,
				message: err.message || 'Gagal mengubah password'
			};
		}
	}
}

export const authState = new AuthStore();
