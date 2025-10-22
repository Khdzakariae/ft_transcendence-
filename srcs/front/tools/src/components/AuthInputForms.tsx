interface AuthInputFormsProps {
	type: 'email' | 'password' | 'text';
	name: string;
	placeholder: string;
	required: boolean;
}

export function AuthInputForms( { type, name, placeholder, required }: AuthInputFormsProps ): JSX.Element {
	return (
		<div className="relative">
			<input
				type={type}
				name={name}
				placeholder={placeholder}
				required={required}
				className="w-full rounded-lg border border-gray-700 bg-primary-bg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
			/>
		</div>
	)
}
