import './index.css';
import { Jarvis } from "./lib/jarvisLib";
import { Views } from "./Views";
import { Utils } from './Utils';

// container where to render the App
const container = document.getElementById('root');

// App
function App(): Element {
	const [path, setPath] = Jarvis.useState(Utils.getCurrentPath());
	console.log("Current Path:", path);
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
			{ Views(dataObj) }
		</div>
	)
}

// Rendering
Jarvis.render(<App />, container);
