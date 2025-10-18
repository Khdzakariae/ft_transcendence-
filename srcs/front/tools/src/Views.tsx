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
		<div className="
			// **Container & Background Optimization**
			// Sets the full viewport height and the dark base background
			min-h-screen bg-gray-900 text-white
			// Flexbox for centering all content
			flex flex-col items-center justify-center 
			// Uses the image as the background with an inset to simulate the banner's position
			// and applies an overlay gradient for better text contrast
			relative overflow-hidden 
			bg-cover bg-center 
			p-4 sm:p-8 md:p-12" style={{ backgroundImage: `url(${Banner})` }}
		>

			<img src={Banner} alt="Ping Pong Banner" className="absolute inset-0 w-full h-full object-cover z-0" />
			{/* Dark Overlay for Readability (Instead of a separate absolute div) */}
			<div className="absolute inset-0 bg-black/60 z-0"></div>

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
				console.log('SignUp Success:', res.message);
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

	return (
		<div>
			<h1>Sign Up</h1>
			<form onSubmit={onSubmit}>
				<input type="email" name="email" placeholder="Email" required />
				<input type="text" name="first" placeholder="First Name" required />
				<input type="text" name="last" placeholder="Last Name" required />
				<input type="password" name="password" placeholder="Password" required />
				<button type="submit">Create Account</button>
				{  (msg && <p>{msg}</p>) || null }
				{ (is_signed_up && Utils.successSignUpRedirect('/sign-in/', setPath) )  || null }
			</form>
		</div>
	)
}

