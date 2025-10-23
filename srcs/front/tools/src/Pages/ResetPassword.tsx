import { AuthLayout } from '../components/AuthLayout';
import { AuthInputForms } from '../components/AuthInputForms';
import Logo from '../assets/ping_pong_logo.png';
import { SecondaryButton } from '../components/Buttons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function ResetPasswordPage(): JSX.Element {
	const [is_loading, setIsLoading] = useState(false);
	const [msg, setMsg] = useState('');
	const [btn_msg, setBtnMsg] = useState('Send Reset Link');
	const navigate = useNavigate();

	const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsLoading(true);
		setBtnMsg('Sending Reset Link...');
		const form = e.currentTarget;
		const email = form.email.value;
	}

	return (
		<AuthLayout>
			<div className="text-center mb-6 flex flex-col justify-between h-full">
				{/* logo */}
				<div className="flex justify-center mb-6">
					<img src={Logo} alt="Logo" className="h-12 sm:h-16 md:h-20" />
				</div>
				<h1 className="text-4xl font-extrabold leading-tight text-white">
					<span className="text-primary-text">Forgot</span> Password
				</h1>
				<p className="text-base sm:text-md md:text-lg text-gray-300 mt-2 mb-6">
					No worries! Just enter your email and we'll send you a link to reset your password.
				</p>
				<form onSubmit={onSubmit} className="space-y-5 font-secondary">
					<AuthInputForms type="email" name="email" placeholder="Email" required />
					<SecondaryButton 
						func={() => {}} 
						props={{ 
							children: btn_msg, 
							type: 'submit', 
							disabled: is_loading, 
							className: `w-full rounded-lg bg-cyan-500 hover:bg-cyan-600 active:bg-primary-btn transition-colors duration-300 text-secondary-text py-3 font-bold shadow-md ${is_loading ? 'opacity-50 cursor-not-allowed' : ''}` 
						}} 
					/>
					{msg && (
						<p className={`text-center font-fontFamily-secondary ${msg.includes('success') ? 'bg-success/20 text-success' : 'bg-error/20 text-error'} rounded-lg p-4`}>
							{msg}
						</p>
					)}
				</form>
				<div className="text-center mt-4">
					<button 
						onClick={() => navigate('/sign-in/')} 
						className="text-md text-gray-300 hover:text-white transition-colors"
					>
						← Back to <span className="font-semibold text-primary-btn underline">Login</span>
					</button>
				</div>
			</div>
		</AuthLayout>
	);
}
