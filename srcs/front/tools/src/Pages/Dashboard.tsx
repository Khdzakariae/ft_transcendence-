import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utils, AuthResponse } from '../Utils';
import Logo from '../assets/ping_pong_logo.png';
import { Link } from 'react-router-dom';
import { RxHamburgerMenu } from "react-icons/rx";
// import { UserIcon, SettingsIcon, FilesIcon, ImagesIcon, BellIcon, TrophyIcon, BarChartIcon } from 'lucide-react';

export function Dashboard(): JSX.Element {
	const navigate = useNavigate();
	const [user, setUser] = useState<AuthResponse['user'] | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [currentPath, _] = useState<string>(window.location.pathname); // select active page in sidebar
	let	loading_flag: boolean = false;
	// const [p, setP] = useState<string>('profile');
	const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

	useEffect(() => {
		Utils.LogLevel.DEBUG && console.log('checking on user: ', user);
	}, [user]);
	
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
				// loading_flag = true;
				setIsLoading(false);
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
		<div className='flex flex-row'>
			<div 
				id='side-bar' 
				className={`flex flex-col min-h-screen space-y-4 border-r-2 border-gray-800 text-center text-white justify-between py-8 transition-all duration-500 ${
					isSidebarExpanded ? 'w-64' : 'w-24'
				}`}
			>
				<div className="flex justify-center">
					<img src={Logo} alt="Logo" className="h-16 transition-all duration-500" />
				</div>
				<button 
					onClick={() => {
						// setP('user-icon-this-is-a-long-test');
						setIsSidebarExpanded(!isSidebarExpanded);
					}}
					className="bg-secondary-btn hover:bg-secondary-btn/30 text-white px-3 py-1 rounded transition-colors duration-200 flex items-center justify-center transition-all duration-500"
				>
					<RxHamburgerMenu className="w-6 h-6 " />
				</button>
				<div className="flex flex-col space-y-4 transition-all duration-500 font-secondary font-medium">
					<Link to="/dashboard/" className={`${currentPath === '/dashboard/' ? 'side-bar-expanded' : 'side-bar-collapsed'}`}>Dashboard</Link>
					<Link to="/dashboard/profile" className={`${currentPath === '/dashboard/profile' ? 'side-bar-expanded' : 'side-bar-collapsed'}`}>Profile</Link>
					<Link to="/dashboard/settings" className={`${currentPath === '/dashboard/settings' ? 'side-bar-expanded' : 'side-bar-collapsed'}`}>Settings</Link>
					<Link to="/dashboard/friends" className={`${currentPath === '/dashboard/friends' ? 'side-bar-expanded' : 'side-bar-collapsed'}`}>Friends</Link>
					<Link to="/dashboard/messages" className={`${currentPath === '/dashboard/messages' ? 'side-bar-expanded' : 'side-bar-collapsed'}`}>Messages</Link>
					<Link to="/dashboard/notifications" className={`${currentPath === '/dashboard/notifications' ? 'side-bar-expanded' : 'side-bar-collapsed'}`}>Notifications</Link>
					<Link to="/dashboard/achievements" className={`${currentPath === '/dashboard/achievements' ? 'side-bar-expanded' : 'side-bar-collapsed'}`}>Achievements</Link>
					<Link to="/dashboard/leaderboard" className={`${currentPath === '/dashboard/leaderboard' ? 'side-bar-expanded' : 'side-bar-collapsed'}`}>Leaderboard</Link>
					<Link to="/dashboard/settings" className={`${currentPath === '/dashboard/settings' ? 'side-bar-expanded' : 'side-bar-collapsed'}`}>Settings</Link>
					<Link to="/dashboard/logout" className={`${currentPath === '/dashboard/logout' ? 'side-bar-expanded' : 'side-bar-collapsed'}`}>Logout</Link>
				</div>
				<div className={`flex flex-col space-y-4 transition-all duration-500 ${!isSidebarExpanded ? 'opacity-0' : 'opacity-100'}`}>
					<Link to="/dashboard/profile" className="hover:text-cyan-400 transition-colors duration-200">Profile</Link>
				</div>
			</div>
			<div className="min-h-screen bg-primary-bg flex items-center justify-center w-full text-center">
				<h1 className="text-white text-2xl font-bold">Welcome {`${user?.name}`}! This is your dashboard.</h1>
			</div>
		</div>
	);
}
