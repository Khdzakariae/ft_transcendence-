import { Jarvis } from './lib/jarvisLib';
import { ViewMap } from './Types';
import Logo from './assets/ping_pong_logo.png'
import Banner from './assets/landing_page_banner_4k.png'
import { PrimaryButton, SecondaryButton } from './components';
import { Utils } from './Utils';

// Pages
export function Views( res: any ): Element | null {
	const viewsMap: ViewMap = {
		'/': LandingPage,
		'/public/': LandingPage,
		'/sign-up/': SignUpPage,
		//'/sign-in/': SignInPage,
	};
	const { path, setPath } = res;

	return viewsMap[path]?.(setPath);
}

function LandingPage( setPath: Function ): Element {
	return (
		<div className="background-auth" style={{ backgroundImage: `url(${Banner})` }}>

			<img src={Banner} alt="Ping Pong Banner" className="absolute inset-0 w-full h-full object-cover z-0" />
			{/* Dark Overlay for Readability (Instead of a separate absolute div) */}
			<div className="absolute inset-0 bg-black/45 z-0"></div>

			{/* Content Wrapper: Centers the main text and buttons */}
			<div className="relative z-10 flex flex-col items-center text-center mx-auto">
				<img src={Logo} alt="Logo" className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mb-10 // Increased spacing for visual break" />
				
				<h1 className="// Text size and font weight for high impact text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-primary font-extrabold leading-none mb-4 text-shadow-md">
					Ready to Play?<span className="text-white drop-shadow-lg font-primary"><br/>it's Your Serve</span>
				</h1>
				
				<p className="text-sm sm:text-base md:text-lg text-gray-300 font-light mb-12 // Increased spacing before buttons font-secondary underline">
					Track stats, connect with friends, and dominate the leaderboard
				</p>
				
				{/* Buttons Container: Responsive layout */}
				<div className="flex flex-col w-full max-w-sm space-y-4 justify-center">
					<SecondaryButton func={ () => Utils.pushStateHistory('/sign-up/', setPath) } props={ { children: 'Join Now' } } />
					<PrimaryButton func={ () => Utils.pushStateHistory('/sign-in/', setPath) } props={{ children: 'Sign In' }}/>
				</div>
			</div>
		</div>
	)
}

function SignUpPage( setPath: Function ): Element {
	const [msg, setMsg] = Jarvis.useState('');
	const [is_signed_up, setIsSignedUp] = Jarvis.useState(false);

	const onSubmit = async (e: HTMLFormElement) => {
	let response = null;

		e.preventDefault();
		const form = e.currentTarget;
		const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
		const firstName = (form.elements.namedItem('first') as HTMLInputElement)?.value;
		const lastName = (form.elements.namedItem('last') as HTMLInputElement)?.value;
		const password = (form.elements.namedItem('password') as HTMLInputElement)?.value;

		// validate form before sending
		// check only password, must contains at least 6 characters, 1 uppercase, 1 lowercase, 1 number
		const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
		if (!passwordRegex.test(password)) {
			setMsg('Password must be at least 6 characters long and include uppercase, lowercase letters, and a number.');
			return;
		}

		Utils.LogLevel.DEBUG && console.log('SignUp res:', { firstName, lastName, email, password });
		try {
			response = await fetch('http://localhost:3000/api/v1/auth/sign-up', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ firstName, lastName, email, password }),
		})}
		catch(e) {
			Utils.LogLevel.ERROR && console.error('SignUp network error:', e);
			const errorMessage = (e && typeof e === 'object' && 'message' in e) ? (e as any).message : String(e);
			setMsg(`Network error: ${errorMessage}`);
			return;
		}
		Utils.LogLevel.DEBUG && console.log('SignUp Response status:', response);

		const contentType: string | null = response.headers.get('content-type');
		let res: any = {};
	
		if (contentType && contentType.includes('application/json')) {
			res = await response.json();
		} else {
			Utils.LogLevel.WARN && console.warn('Response is not JSON');
		}
		
		switch(response.status) {
			case 200:
			case 201:
				setMsg(`${res.message}`);
				setIsSignedUp(true);
				break;
			case 409:
				setMsg(`${res.error}`);
				break;
			case 500:
				setMsg(`${res.error}`);
				break;
			default:
				Utils.LogLevel.ERROR && console.error('Unexpected response status:', response.status, res);
				setMsg(`Unexpected error occurred (${response.status}). Please try again.`);
		}
	}

	// relative overflow-hidden 
// 			bg-cover bg-center min-h-screen bg-gray-900 style={{ backgroundImage: `url(${Banner})`
	return (
		<div className="background-auth" style={{ backgroundImage: `url(${Banner})` }} >

			<img src={Banner} alt="Ping Pong Banner" className="absolute inset-0 w-full h-full object-cover z-0" />
			{/* Dark Overlay for Readability (Instead of a separate absolute div) */}
			<div className="absolute inset-0 bg-black/60 z-0"></div>

			{/* Content Wrapper: Centers the main text and form */}
			<div className="auth-elements-container font-primary">

			{/* <div className="w-full max-w-3xl bg-primary-elements backdrop-blur-sm rounded-2xl p-6 sm:p-10 shadow-xl border-[1.5px] border-transparent rounded-2xl [border-image:linear-gradient(135deg,#00FFFF,#FF6B00)_1] shadow-[0_0_15px_#00FFFF55]"> */}
				{/* logo */}
				<div className="flex justify-center mb-6">
					<img src={Logo} alt="Logo" className="h-12 sm:h-16 md:h-20" />
				</div>

				{/* header */}
				<div className="text-center mb-6">
					<h1 className="text-4xl font-extrabold leading-tight">
						Create Your <span className="text-primary-text underline">Account</span>
					</h1>
					<p className="text-md mt-2">
						Join, track stats, and compete on the leaderboard
					</p>
				</div>

				{/* back to login */}
				<div className="text-center mb-6">
					<a href="/sign-in/" className="text-md text-gray-300 hover:text-white transition-colors">
						← Back to <span className="font-semibold text-cyan-300 underline">Login</span>
					</a>
				</div>

				<form onSubmit={onSubmit} className="space-y-5 font-secondary">
					{/* Email */}
			
					<div className="relative">
						<input
							type="email"
							name="email"
							placeholder="Email"
							required
							className="w-full rounded-lg border border-gray-700 bg-primary-bg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
						/>
					</div>

					{/* First + Last (responsive two-column on sm+) */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<input
							type="text"
							name="first"
							placeholder="First Name"
							required
							className="w-full rounded-lg border border-gray-700 bg-primary-bg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
						/>
						<input
							type="text"
							name="last"
							placeholder="Last Name"
							required
							className="w-full rounded-lg border border-gray-700 bg-primary-bg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
						/>
					</div>

					{/* Password */}
					<div className="relative">
						<input
							type="password"
							name="password"
							placeholder="Password"
							required
							className="w-full rounded-lg border border-gray-700 bg-primary-bg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
						/>
					</div>

					{/* Submit */}
					<PrimaryButton func={ () => {} } props={ { children: 'Create Account', type: 'submit', className: 'w-full rounded-lg bg-cyan-500 hover:bg-cyan-600 active:bg-primary-btn transition-colors duration-300 text-secondary-text py-3 font-bold shadow-md' } } />
	
					{/* Message / Redirect */}
					{(msg && <p className={`text-center font-fontFamily-secondary ${msg.includes('success') ? 'bg-success/20 text-success' : 'bg-error/20 text-error'} rounded-lg p-4`}>{msg}</p>) || null}
					{(is_signed_up && Utils.successSignUpRedirect('/sign-in/', setPath)) || null}
				</form>

				{/* Already have account */}
				<div className="mt-6 text-center text-md text-gray-300">
					<a href="/sign-in/" className="hover:text-white transition-colors">
						Already have an account?{' '}
						<span className="font-semibold text-cyan-300 underline">Sign In</span>
					</a>
				</div>

				{/* Social buttons: stacked on mobile, inline on md */}
				<div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 font-secondary">
					<button
						type="button"
						className="flex items-center justify-center gap-3 w-full rounded-lg border border-gray-700 bg-secondary-btn py-3 text-md font-medium hover:bg-white/10 transition duration-500"
					>
						{/* small google icon placeholder */}
						<span className="h-5 w-5 rounded-sm bg-white/20 flex items-center justify-center text-xs">G</span>
						<span>Continue with Google</span>
					</button>

					<button
						type="button"
						className="flex items-center justify-center gap-3 w-full rounded-lg border border-gray-700 bg-secondary-btn py-3 text-md font-medium hover:bg-white/10 transition duration-500"
					>
						<span className="h-5 w-5 rounded-sm bg-white/20 flex items-center justify-center text-[10px] font-bold">42</span>
						<span>Continue with 42 Intra</span>
					</button>
				</div>
			</div>
		</div>
	)
}
