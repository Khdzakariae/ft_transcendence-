import './index.css';
import { Views } from "./Views";
import { Utils } from './Utils';
import ReactDOM from 'react-dom/client';
import { useState } from 'react';

// container where to render the App
const container = document.getElementById('root');

// App
function App(): JSX.Element {
	const [path, setPath] = useState(Utils.getCurrentPath());
	const dataObj: Object = {
		path,
		setPath,
	}

	window.onpopstate = (e) => {
		e.preventDefault();
		const newView = Utils.getCurrentPath();
		setPath(newView);
	};

	return (
		<div className="bg-primary-bg  min-h-screen">
			<Views {...dataObj} />
		</div>
	)
}

// Rendering

// render inside container with react 18

const root = ReactDOM.createRoot(container!);
root.render(<App />);
