// Utilities
export const LogLevel = {
	INFO: true,
	WARN: true,
	ERROR: true,
	DEBUG: true,
} as const;

// Authentication utilities
export interface AuthResponse {
	isAuthenticated: boolean;
	user?: {
		id: string;
		email: string;
		firstName: string;
		lastName: string;
	};
	message?: string;
}

async function checkAuthCookie(): Promise<AuthResponse> {
	try {
		const response = await fetch('http://localhost:3000/api/v1/auth/checkAuthCookie', {
			method: 'GET',
			credentials: 'include', // Important: include cookies
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			return { isAuthenticated: false, message: 'Authentication check failed' };
		}

		const data = await response.json();
		console.log('Auth check response data:', data);
		return data;
	} catch (error) {
		Utils.LogLevel.ERROR && console.error('Auth check error:', error);
		return { isAuthenticated: false, message: 'Network error during authentication check' };
	}
}

export const Utils = {
	LogLevel,
	checkAuthCookie
}
