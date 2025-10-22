import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utils, AuthResponse } from '../Utils';

export function Dashboard(): JSX.Element {
	const navigate = useNavigate();
	const [user, setUser] = useState<AuthResponse['user'] | null>(null);
	const [isLoading, setIsLoading] = useState(true);

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
				setIsLoading(false);
			}
		};

		checkAuth();
	}, [navigate]);

	const handleLogout = async () => {
		try {
			// Call logout endpoint if it exists
			await fetch('http://localhost:3000/api/v1/auth/logout', {
				method: 'POST',
				credentials: 'include',
			});
		} catch (error) {
			Utils.LogLevel.ERROR && console.error('Logout error:', error);
		} finally {
			// Redirect to home regardless of logout success
			navigate('/', { replace: true });
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-primary-bg flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
					<p className="text-gray-300">Loading dashboard...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-primary-bg">
			<div className="container mx-auto px-4 py-8">
				{/* Header */}
				<div className="flex justify-between items-center mb-8">
					<div>
						<h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
						<p className="text-gray-300">
							Welcome back, {user?.firstName} {user?.lastName}!
						</p>
					</div>
					<button
						onClick={handleLogout}
						className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
					>
						Logout
					</button>
				</div>

				{/* Dashboard Content */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{/* User Info Card */}
					<div className="bg-gray-800 rounded-lg p-6">
						<h3 className="text-xl font-semibold text-white mb-4">User Information</h3>
						<div className="space-y-2">
							<p className="text-gray-300">
								<strong>Email:</strong> {user?.email}
							</p>
							<p className="text-gray-300">
								<strong>Name:</strong> {user?.firstName} {user?.lastName}
							</p>
							<p className="text-gray-300">
								<strong>ID:</strong> {user?.id}
							</p>
						</div>
					</div>

					{/* Stats Card */}
					<div className="bg-gray-800 rounded-lg p-6">
						<h3 className="text-xl font-semibold text-white mb-4">Game Stats</h3>
						<div className="space-y-2">
							<p className="text-gray-300">Games Played: 0</p>
							<p className="text-gray-300">Wins: 0</p>
							<p className="text-gray-300">Losses: 0</p>
							<p className="text-gray-300">Win Rate: 0%</p>
						</div>
					</div>

					{/* Quick Actions Card */}
					<div className="bg-gray-800 rounded-lg p-6">
						<h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
						<div className="space-y-3">
							<button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-4 rounded-lg transition-colors">
								Start New Game
							</button>
							<button className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors">
								View Leaderboard
							</button>
							<button className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors">
								Find Friends
							</button>
						</div>
					</div>
				</div>

				{/* Recent Activity */}
				<div className="mt-8">
					<div className="bg-gray-800 rounded-lg p-6">
						<h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
						<p className="text-gray-300">No recent activity to display.</p>
					</div>
				</div>
			</div>
		</div>
	);
}
