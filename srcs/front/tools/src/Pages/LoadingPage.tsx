import { useState, useEffect } from 'react'
import { AuthResponse, Utils } from '../Utils';
import { useNavigate } from 'react-router-dom';

interface LoadingPageProps {
	children: React.ReactNode;
}

export function LoadingPage( { children }: LoadingPageProps): JSX.Element {
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();
	
	useEffect(() => {
		const checkAuth = async () => {
			try {
				const authResult: AuthResponse = await Utils.checkAuthCookie();
				
				if (authResult.isAuthenticated && authResult.user) {
					setIsLoading(true); // prepare loading view for dashboard
				} else {
					navigate('/', { replace: true });
				}
			} catch (error) {
				Utils.LogLevel.ERROR && console.error('LoadingPage auth check error:', error);
				navigate('/', { replace: true });
			}	
		};
		checkAuth();
	}, []);

	useEffect(() => {
	let timer: NodeJS.Timeout;

	if (isLoading) {
		timer = setTimeout(() => {
			setIsLoading(false);
		}, (2000));

		return clearTimeout(timer)
	}}, [isLoading])

	if (isLoading) {
		return (
			<div className="min-h-screen bg-primary-bg flex flex-col items-center justify-center gap-6">
				<h1 className="animate-pulse text-primary-btn text-2xl sm:text-4xl md:text-6xl font-bold text-center font-primary">Setting up your dashboard...</h1>
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-btn"></div>
			</div>
		);
	}
	return <>{children}</>;
}
