import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utils } from '../Utils';
import Logo from '../assets/ping_pong_logo.png'
import { PrimaryButton } from '../components/Buttons';
import { AuthLayout } from '../components/AuthLayout';
import { AuthInputForms } from '../components/AuthInputForms';
import { AuthProvidersButtons } from '../components/Buttons';


export function SignUpPage(): JSX.Element {
	const navigate = useNavigate();
	const [msg, setMsg] = useState(''); // message to show user
	const [is_signed_up, setIsSignedUp] = useState(false); // track if user signed up successfully
	const [is_loading, setIsLoading] = useState(false); // track account creation loading state
	const [creation_msg, setCreationMsg] = useState('Create Account'); // create account button message

	// useEffect for redirect after signup
	useEffect(() => {
		let timer: NodeJS.Timeout;

		if (is_signed_up) {
			timer = setTimeout(() => {
				navigate('/sign-in/');
			}, 5000);
		}
		return () => clearTimeout(timer);
	}, [is_signed_up, navigate]);
	
	const onSubmit = async (e: any) => {
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
			setIsLoading(true);
			setCreationMsg('Creating...');
			response = await fetch('http://localhost:3000/api/v1/auth/sign-up', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ firstName, lastName, email, password }),
			});
		} catch(e) {
			Utils.LogLevel.ERROR && console.error('SignUp network error:', e);
			const errorMessage = (e && typeof e === 'object' && 'message' in e) ? (e as any).message : String(e);
			setMsg(`Network error: ${errorMessage}`);
			setCreationMsg('Create Account');
			setIsLoading(false);
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
				setCreationMsg('Redirecting to Sign In...');
				setIsSignedUp(true);
				break;
			case 409:
				setMsg(`${res.error}`);
				setCreationMsg('Create Account');
				setIsLoading(false);
				break;
			case 500:
				setMsg(`${res.error}`);
				setCreationMsg('Create Account');
				setIsLoading(false);
				break;
			default:
				Utils.LogLevel.ERROR && console.error('Unexpected response status:', response.status, res);
				setMsg(`Unexpected error occurred (${response.status}). Please try again.`);
				setCreationMsg('Create Account');
				setIsLoading(false);
		}
	}

	return (
		<div>
			<AuthLayout>
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
					<button onClick={() => navigate('/sign-in/')} className="text-md text-gray-300 hover:text-white transition-colors">
						← Back to <span className="font-semibold text-cyan-300 underline">Login</span>
					</button>
				</div>

				<form onSubmit={onSubmit} className="space-y-5 font-secondary">
					{/* Email */}
					<AuthInputForms type="email" name="email" placeholder="Email" required />

					{/* First + Last (responsive two-column on sm+) */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<AuthInputForms type="text" name="first" placeholder="First Name" required />
						<AuthInputForms type="text" name="last" placeholder="Last Name" required />
					</div>

					{/* Password */}
					<AuthInputForms type="password" name="password" placeholder="Password" required />

					{/* Submit */}
					<PrimaryButton func={ () => {} } props={ { children: creation_msg, type: 'submit', disabled: is_loading, className: `w-full rounded-lg bg-cyan-500 hover:bg-cyan-600 active:bg-primary-btn transition-colors duration-300 text-secondary-text py-3 font-bold shadow-md ${is_loading ? 'opacity-50 cursor-not-allowed' : ''}` } } />
		
					{/* Message / Redirect */}
					{(msg && <p className={`text-center font-fontFamily-secondary ${msg.includes('success') ? 'bg-success/20 text-success' : 'bg-error/20 text-error'} rounded-lg p-4`}>{msg}</p>) || null}
				</form>

				{/* Already have account */}
				<div className="mt-6 text-center text-md text-gray-300">
					<button onClick={() => navigate('/sign-in/')} className="hover:text-white transition-colors">
						Already have an account?{' '}
						<span className="font-semibold text-cyan-300 underline">Sign In</span>
					</button>
				</div>

				{/* Social buttons: stacked on mobile, inline on md+ */}
				<AuthProvidersButtons />
			</AuthLayout>
		</div>
	)
}
