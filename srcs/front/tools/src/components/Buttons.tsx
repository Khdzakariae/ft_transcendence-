// create reusable components for views

// buttons components
export function PrimaryButton({
  func,
  ...props
}: {
  func: Function;
  [key: string]: any;
}): JSX.Element {
  return (
    <button
      onClick={() => func()}
      className="
				font-secondary
				w-auto
				px-8 py-3 
				bg-primary-btn text-gray-900 font-bold 
				rounded-full 
				shadow-lg shadow-cyan-400/50 
				transition duration-500 transform hover:scale-105
				hover:bg-cyan-400
				focus:outline-none focus:ring-4 focus:ring-cyan-400/50
			"
      {...props.props}
    >
      {props.props.children}
    </button>
  );
}

export function SecondaryButton({
  func,
  ...props
}: {
  func: Function;
  [key: string]: any;
}): JSX.Element {
  return (
    <button
      onClick={() => func()}
      className="
				font-secondary
				w-full sm:w-auto 
				px-8 py-3 
				bg-secondary-btn text-white font-bold 
				rounded-full 
				shadow-lg shadow-orange-600/50 
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

export function AuthProvidersButtons() {
  const auth_login = (auth_provider: "google" | "42intra") => {
    // Store attempt info before redirect
    sessionStorage.setItem("auth_provider", auth_provider);
    window.location.href = `http://localhost:3000/api/v1/auth/${auth_provider}`;
  };

  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 font-secondary">
      <button
        type="button"
        onClick={auth_login.bind(null, "google")}
        className="flex items-center justify-center gap-3 w-full rounded-lg border border-gray-700 bg-secondary-btn py-3 text-md font-medium hover:bg-white/10 transition duration-500"
      >
        {/* small google icon placeholder */}
        <span className="h-5 w-5 rounded-sm bg-white/20 flex items-center justify-center text-xs">
          G
        </span>
        <span>Continue with Google</span>
      </button>

      <button
        type="button"
        onClick={auth_login.bind(null, "42intra")}
        className="flex items-center justify-center gap-3 w-full rounded-lg border border-gray-700 bg-secondary-btn py-3 text-md font-medium hover:bg-white/10 transition duration-500"
      >
        <span className="h-5 w-5 rounded-sm bg-white/20 flex items-center justify-center text-[10px] font-bold">
          42
        </span>
        <span>Continue with 42</span>
      </button>
    </div>
  );
}
