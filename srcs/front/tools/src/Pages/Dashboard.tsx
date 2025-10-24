import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utils, AuthResponse } from '../Utils';

export function Dashboard(): JSX.Element {
	const navigate = useNavigate();
	const [user, setUser] = useState<AuthResponse['user'] | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	let	loading_flag: boolean = false;

	useEffect(() => {
		let timer: NodeJS.Timeout;

		// delay dashboard loading
		if (loading_flag = true) {
			timer = setTimeout(() => {
				setIsLoading(false);
			}, (2000));
		}

		return () => clearTimeout(timer);
	}, [loading_flag]);
	
	useEffect(() => {
		const checkAuth = async () => {
			try {
				const authResult: AuthResponse = await Utils.checkAuthCookie();
				
				if (authResult.isAuthenticated && authResult.user) {
					setUser(authResult.user);
				} else {
					// If not authenticated, redirect to home
					navigate('/', { replace: true });
				}
			} catch (error) {
				Utils.LogLevel.ERROR && console.error('Dashboard auth check error:', error);
				navigate('/', { replace: true });
			} finally {
				loading_flag = true;
			}
		};

		checkAuth();
	}, [navigate]);

	if (isLoading) {
		return (
			<div className="min-h-screen bg-primary-bg flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
					<p className="animate-pulse text-gray-400 font-primary text-center text-md sm:text-lg">Loading dashboard...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-primary-bg flex items-center justify-center">
			<h1 className="text-white text-2xl font-bold">Welcome {`${user?.name}`}! This is your dashboard.</h1>
		</div>
	);
}
