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
		<div className="min-h-screen bg-primary-bg text-white flex items-center justify-center p-6 sm:p-10 font-primary">
			<div className="w-full max-w-3xl bg-primary-elements backdrop-blur-sm rounded-2xl p-6 sm:p-10 shadow-xl">
				{/* logo */}
				<div className="flex justify-center mb-6">
					<img src={Logo} alt="Logo" className="h-12 sm:h-16 md:h-20" />
				</div>

				{/* header */}
				<div className="text-center mb-6">
					<h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight">
						Create Your <span className="text-primary-text underline">Account</span>
					</h1>
					<p className="text-sm sm:text-base mt-2">
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
					<button
						type="submit"
						className="w-full rounded-lg bg-cyan-500 hover:bg-cyan-600 active:bg-primary-btn transition-colors duration-300 text-secondary-text py-3 font-bold shadow-md font-secondary"
					>
						Create Account
					</button>

					{/* Message / Redirect */}
					{(msg && <p className="text-center text-sm text-red-400">{msg}</p>) || null}
					{(is_signed_up && Utils.successSignUpRedirect('/sign-in/', setPath)) || null}
				</form>

				{/* Already have account */}
				<div className="mt-6 text-center text-sm text-gray-300">
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

// import React from 'react';
// Make sure to import your logo
// import Logo from './path/to/Logo.png'; 

// // --- Icon Components (or inline them as below) ---
// // User Icon (for First/Last Name)
// const UserIcon = () => (
//   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-brand-secondary-text">
//     <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A1.875 1.875 0 0 1 18 22.5H6a1.875 1.875 0 0 1-1.499-2.382Z" />
//   </svg>
// );

// // Email Icon
// const EmailIcon = () => (
//   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-brand-secondary-text">
//     <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
//   </svg>
// );

// // Password Icon
// const PasswordIcon = () => (
//   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-brand-secondary-text">
//     <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 0 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
//   </svg>
// );

// // Eye Icon
// const EyeIcon = () => (
//   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-brand-secondary-text">
//     <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 10.224 7.29 6 12 6s8.577 4.224 9.964 5.683c.213.23.213.626 0 .856-1.387 1.459-5.356 5.683-9.964 5.683S3.423 13.781 2.036 12.322Z" />
//     <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
//   </svg>
// );

// // Google Icon Placeholder (Replace with actual SVG)
// const GoogleIcon = () => (
//     <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//         <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0 5.49 0 0 5.49 0 12s5.49 12 12.24 12c6.957 0 11.536-4.817 11.536-11.756 0-.79-.07-1.567-.197-2.319H12.24z"/>
//     </svg>
// );

// // 42 Icon Placeholder (Replace with actual SVG or <img>)
// const FortyTwoIcon = () => (
//     <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-sm bg-black">
//         <span className="text-[10px] font-bold text-white">42</span>
//     </div>
// );


// // --- Your Component ---
// function SignUpForm({ onSubmit, msg, is_signed_up, Utils, setPath }) {
  
//   // A simple state for password visibility
//   const [showPassword, setShowPassword] = React.useState(false);

//   return (
//     <div className="flex min-h-screen items-center justify-center bg-brand-dark p-4 text-white">
//       <div className="w-full max-w-md">
        
//         {/* logo */}
//         <img src={Logo} alt="Logo" className="mx-auto mb-6 h-auto w-24" />
        
//         {/* header */}
//         <h1 className="mb-2 text-center text-4xl font-bold">
//           Create Your <span className="text-brand-highlight-orange">Account</span>
//         </h1>

//         {/* back to login */}
//         <div className="mb-6 text-center">
//           <a href="/sign-in/" className="text-sm text-brand-secondary-text transition-colors hover:text-white">
//             ← Back to <span className="font-semibold text-brand-highlight-blue">Login</span>
//           </a>
//         </div>

//         {/* Main Form Card */}
//         <div className="rounded-3xl bg-brand-card p-8 shadow-2xl">
//           <form onSubmit={onSubmit} className="space-y-5">
            
//             {/* Input 1: Email (from your code) */}
//             <div className="relative">
//               <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
//                 <EmailIcon />
//               </div>
//               <input 
//                 type="email" 
//                 name="email" 
//                 placeholder="Email" 
//                 required 
//                 className="w-full rounded-lg border border-brand-border bg-brand-input py-3 pl-12 pr-4 text-white placeholder-brand-secondary-text focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary" 
//               />
//             </div>

//             {/* Input 2: First Name (from your code) */}
//             <div className="relative">
//               <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
//                 <UserIcon />
//               </div>
//               <input 
//                 type="text" 
//                 name="first" 
//                 placeholder="First Name" 
//                 required 
//                 className="w-full rounded-lg border border-brand-border bg-brand-input py-3 pl-12 pr-4 text-white placeholder-brand-secondary-text focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary" 
//               />
//             </div>

//             {/* Input 3: Last Name (from your code) */}
//             <div className="relative">
//               <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
//                 <UserIcon />
//               </div>
//               <input 
//                 type="text" 
//                 name="last" 
//                 placeholder="Last Name" 
//                 required 
//                 className="w-full rounded-lg border border-brand-border bg-brand-input py-3 pl-12 pr-4 text-white placeholder-brand-secondary-text focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary" 
//               />
//             </div>

//             {/* Input 4: Password (from your code) */}
//             <div className="relative">
//               <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
//                 <PasswordIcon />
//               </div>
//               <input 
//                 type={showPassword ? "text" : "password"} 
//                 name="password" 
//                 placeholder="Password" 
//                 required 
//                 className="w-full rounded-lg border border-brand-border bg-brand-input py-3 pl-12 pr-12 text-white placeholder-brand-secondary-text focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary" 
//               />
//               <button 
//                 type="button" 
//                 onClick={() => setShowPassword(!showPassword)} 
//                 className="absolute inset-y-0 right-0 flex items-center pr-4"
//               >
//                 <EyeIcon />
//               </button>
//             </div>
            
//             {/* Submit Button (Replaced PrimaryButton) */}
//             <button 
//               type="submit"
//               className="w-full rounded-lg bg-brand-primary py-3 font-bold text-brand-primary-text shadow-primary-glow transition-all duration-300 hover:bg-opacity-90 hover:shadow-primary-glow-hover focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-brand-card"
//             >
//               Register
//             </button>
            
//             {/* Message/Redirect Logic (from your code) */}
//             {  (msg && <p className="text-center text-sm text-red-400">{msg}</p>) || null }
//             { (is_signed_up && Utils.successSignUpRedirect('/sign-in/', setPath) )  || null }
//           </form>

//           {/* "Already have an account?" link */}
//           <p className="mt-6 text-center text-sm text-brand-secondary-text">
//             Already have an account?{' '}
//             <a href="/sign-in/" className="font-semibold text-brand-highlight-blue transition-colors hover:text-cyan-300">
//               Sign in
//             </a>
//           </p>

//           {/* Social Buttons (Replaced SecondaryButton) */}
//           <div className="mt-6 space-y-4">
//             {/* Google Button */}
//             <button 
//               className="flex w-full items-center justify-center space-x-3 rounded-lg bg-gradient-to-r from-brand-highlight-orange to-brand-gradient-end py-3 font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-highlight-orange focus:ring-offset-2 focus:ring-offset-brand-card"
//               // onClick={func_for_google}
//             >
//               <GoogleIcon />
//               <span>Continue with Google</span>
//             </button>
            
//             {/* 42 Intra Button */}
//             <button 
//               className="flex w-full items-center justify-center space-x-3 rounded-lg bg-gradient-to-r from-brand-highlight-orange to-brand-gradient-end py-3 font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-highlight-orange focus:ring-offset-2 focus:ring-offset-brand-card"
//               // onClick={func_for_42}
//             >
//               <FortyTwoIcon />
//               <span>Continue with 42 intra</span>
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }