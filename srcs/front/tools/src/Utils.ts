// Utilities
function getCurrentPath(): string {
	// add '/' if missing
	if (window.location.pathname !== '/') {
		return window.location.pathname.endsWith('/') ? window.location.pathname : `${window.location.pathname}/`;
	}

	return window.location.pathname;
}

function pushStateHistory(new_path: string, setPath: Function): void {
	// Update the URL without reloading the page
	window.history.pushState({}, '', new_path);
	setPath(new_path);
}

function successSignUpRedirect(new_path: string, setPath: Function): null {
	setTimeout(() => { Utils.pushStateHistory(new_path, setPath) }, 2000);
	return null;
}

export const LogLevel = {
	INFO: true,
	WARN: true,
	ERROR: true,
	DEBUG: true,
} as const;

export const Utils = {
    getCurrentPath,
	pushStateHistory,
	LogLevel,
	successSignUpRedirect,
}
