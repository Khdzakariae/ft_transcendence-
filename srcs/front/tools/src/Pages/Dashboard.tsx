import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utils, AuthResponse } from '../Utils';
import Logo from '../assets/ping_pong_logo.png';
import { Link } from 'react-router-dom';
import { RxHamburgerMenu } from "react-icons/rx";
import { RiGamepadLine } from "react-icons/ri";
import { LuLayoutDashboard } from "react-icons/lu";
import { CgProfile } from "react-icons/cg";
import { IoSettingsOutline } from "react-icons/io5";
import { LiaUserFriendsSolid } from "react-icons/lia";
import { IoChatbubblesOutline } from "react-icons/io5";
import { TbLogout2 } from "react-icons/tb";

// import { UserIcon, SettingsIcon, FilesIcon, ImagesIcon, BellIcon, TrophyIcon, BarChartIcon } from 'lucide-react';

export function Dashboard(): JSX.Element {
	const navigate = useNavigate();
	const [user, setUser] = useState<AuthResponse['user'] | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [currentPath, _] = useState<string>(Utils.trimIfEndsWith(window.location.pathname, '/')); // select active page in sidebar
	let	loading_flag: boolean = false;
	// const [p, setP] = useState<string>('profile');
	const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

	useEffect(() => {
		Utils.LogLevel.DEBUG && console.log('checking on user: ', user);
		console.log('checking on current path: ', document.location.pathname)
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
					<div id='nav-bar-section' className={`flex flex-row justify-center items-center	gap-2 ${currentPath === '/dashboard' ? 'current-section' : 'default-section'}`}>
						<div className='flex basis-1/3 justify-end'>
							<LuLayoutDashboard className='w-6 h-6' />
						</div>
						<Link to="/dashboard" className='basis-2/3 text-left'>Dashboard</Link>
					</div>
					<div id='nav-bar-section' className={`flex flex-row justify-center items-center gap-2	${currentPath === '/game' ? 'current-section' : 'default-section'}`}>
						<div className='flex basis-1/3 justify-end'>
							<RiGamepadLine className='w-6 h-6' />  
						</div>
						<Link to="/dashboard/game" className='basis-2/3 text-left'>Game</Link>
					</div>
					<div id='nav-bar-section' className={`flex flex-row justify-center items-center gap-2 ${currentPath === '/profile' ? 'current-section' : 'default-section'}`}>
						<div className='flex justify-end basis-1/3'>
							<CgProfile className='w-6 h-6' />
						</div>
						<Link to="/dashboard/profile" className='basis-2/3 text-left'>Profile</Link>
					</div>
					<div id='nav-bar-section' className={`flex flex-row justify-center items-center gap-2 ${currentPath === '/settings' ? 'current-section' : 'default-section'}`}>
						<div className='flex justify-end basis-1/3'>
							<IoSettingsOutline className='w-6 h-6' />
						</div>
						<Link to="/dashboard/settings" className='basis-2/3 text-left'>Settings</Link>
					</div>
					<div id='nav-bar-section' className={`flex flex-row justify-center items-center gap-2 ${currentPath === '/friends' ? 'current-section' : 'default-section'}`}>
						<div className='flex justify-end basis-1/3'>
							<LiaUserFriendsSolid className='w-6 h-6' />
						</div>
						<Link to="/dashboard/friends" className='basis-2/3 text-left'>Friends</Link>
					</div>
					<div id='nav-bar-section' className={`flex flex-row justify-center items-center gap-2 ${currentPath === '/messages' ? 'current-section' : 'default-section'}`}>
						<div className='flex justify-end basis-1/3'>
							<IoChatbubblesOutline className='w-6 h-6' />
						</div>
						<Link to="/dashboard/messages" className='basis-2/3 text-left'>Messages</Link>
					</div>
					<div id='nav-bar-section' className={`flex flex-row justify-center items-center gap-2 ${currentPath === '/logout' ? 'current-section' : 'default-section'}`}>
						<div className='flex justify-end basis-1/3'>
							<TbLogout2 className='w-6 h-6' />
						</div>
						<Link to="/dashboard/logout" className='basis-2/3 text-left'>Logout</Link>
					</div>
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
