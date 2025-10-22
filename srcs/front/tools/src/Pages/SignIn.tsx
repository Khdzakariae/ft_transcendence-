// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Banner from '../assets/landing_page_banner_4k.png';
import { AuthLayout } from '../components/AuthLayout';
import Logo from '../assets/ping_pong_logo.png';

export function SignInPage(): JSX.Element {
	return (
		<div>
			<AuthLayout>
				<div>
					{/* Logo */}
					<div className="flex justify-center mb-6">
						<img src={Logo} alt="Logo" className="h-12 sm:h-16 md:h-20" />
					</div>

					{/* Header */}
					<div className="text-center mb-6">
					<h1 className="text-4xl font-extrabold leading-tight">
						Welcome
					</h1>
					<p className="text-md mt-2">
						Glad to have you back!
					</p>
				</div>
				</div>
			</AuthLayout>
		</div>
	)
}
