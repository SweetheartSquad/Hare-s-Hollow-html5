import Resizer from './Resizer';
import size from './size';
import './assets/style.css';

// try to auto-focus and make sure the game can be focused with a click if run from an iframe
window.focus();
document.body.addEventListener('mousedown', function() {
	window.focus();
});

// 0 = preload doesn't visually affect loader progress
// 1 = asset load doesn't visually affect loader progress
// .5 = preload and asset load equally visually affect loader progress
const preloadWeight = 1;

const resizer = new Resizer(size.x, size.y, Resizer.SCALE_MODES.FIT);
document.body.appendChild(resizer.element);

const playEl = document.createElement('button');
playEl.textContent = "Play";
resizer.appendChild(playEl);

playEl.onclick = play;

const progressEl = document.createElement('p');

document.addEventListener('chunk-progress-webpack-plugin', ({ detail: { loaded, total, resource } }) => {
	loadProgressHandler({
			progress: loaded / total * 100
		},
		resource
	);
});

function play() {
	playEl.remove();

	resizer.appendChild(progressEl);

	// start the preload
	loadProgressHandler({ progress: 0 });

	Promise.all([
			import ('./Game')
		])
		.then(([{
			default: game
		}]) => {
			preloaded = true;
			progressEl.remove();

			resizer.appendChild(game.view);
		}, error => {
			preloaded = true;
			fail({
				message: 'Unsupported browser',
				error
			});
		});
}



let preloaded = false;
const loadingAnimation = [
	'...',
	'&nbsp;..',
	'.&nbsp;.',
	'..&nbsp;'
];

function renderPreload() {
	progressEl.innerHTML = `Loading: ${loadingAnimation[
		Math.floor(Date.now() / 100 % loadingAnimation.length)
	]}`;
}

function fail({
	message,
	error
}) {
	progressEl.textContent = `${message} - Sorry :(`;
	throw error;
}



function loadProgressHandler(loader, resource = { url: "N/A" }) {
	// called during loading
	let { progress } = loader;
	if (preloaded) {
		progress *= 1 - preloadWeight;
		progress += preloadWeight * 100;
	} else {
		progress *= preloadWeight;
	}
	progressEl.innerHTML = `Loading: ${(progress < 10 ? '&nbsp;': '')}${Math.floor(progress)}%`;
}
