import './index.css';
import { Views } from "./Views";
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// container where to render the App
const container = document.getElementById('root');

// App
function App(): JSX.Element {
	return (
		<BrowserRouter>
			<div className="bg-primary-bg min-h-screen">
				<Views />
			</div>
		</BrowserRouter>
	)
}

// Rendering

// render inside container with react 18

const root = ReactDOM.createRoot(container!);
root.render(<App />);
