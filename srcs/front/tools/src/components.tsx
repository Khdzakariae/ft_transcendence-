// create reusable components for views
import { Jarvis } from './lib/jarvisLib';

// buttons components
export function PrimaryButton({ func, ...props }: { func: Function; [key: string]: any }): Element {
	console.log('props:', props);
	return (
		<button
			onClick={() => func()}
			className="
				// Layout
				font-secondary
                w-auto
                px-8 py-3 
                // Color and Style
                bg-primary-btn text-gray-900 font-bold 
                rounded-full 
                shadow-lg shadow-cyan-400/50 
                // Interaction
                transition duration-500 transform hover:scale-105
                hover:bg-cyan-400
                focus:outline-none focus:ring-4 focus:ring-cyan-400/50ext-white font-bold 
				rounded-full
			"
			{...props.props}
		>
			{props.props.children}
		</button>
	);
}

export function SecondaryButton({ func, ...props }: { func: Function; [key: string]: any }): Element {
	console.log('props:', props);
	return (
		<button
			onClick={() => func()}
			className="
				// Layout
				font-secondary
                w-100 sm:w-auto 
                px-8 py-3 
                // Color and Style
                bg-secondary-btn text-white font-bold 
                rounded-full 
                shadow-lg shadow-orange-600/50 
                // Interaction
                transition duration-500 transform hover:scale-105
                hover:bg-orange-400
                focus:outline-none focus:ring-4 focus:ring-orange-600/50
			"
			{...props.props}
		>
			{props.props.children}
		</button>
	);
}

