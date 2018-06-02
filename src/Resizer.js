import './resizer.css';

const SCALE_MODES = Object.freeze({
	FIT: Symbol('FIT'),
	COVER: Symbol('COVER'),
	MULTIPLES: Symbol('MULTIPLES'), // scale up in multiples of original size
	NONE: Symbol('NONE') // don't scale
});

const SCALE_LUT = {};
SCALE_LUT[SCALE_MODES.FIT] = function(containerWidth, containerHeight, baseWidth, baseHeight, ratio) {
	let width = containerWidth;
	let height = containerHeight;
	if (width / height < ratio) {
		height = Math.round(width / ratio);
	} else {
		width = Math.round(height * ratio);
	}
	return [width, height, width / baseWidth];
};

SCALE_LUT[SCALE_MODES.NONE] = function(containerWidth, containerHeight, baseWidth, baseHeight, ratio) {
	return [baseWidth, baseHeight, 1];
};

SCALE_LUT[SCALE_MODES.MULTIPLES] = function(containerWidth, containerHeight, baseWidth, baseHeight, ratio) {
	let width = containerWidth;
	let height = containerHeight;
	if ((width / height) < ratio) {
		height = Math.round(width / ratio);
	} else {
		width = Math.round(height * ratio);
	}

	let scaleMultiplier = 1;
	let aw = baseWidth;
	let ah = baseHeight;

	while (aw + baseWidth <= width || ah + baseHeight <= height) {
		aw += baseWidth;
		ah += baseHeight;
		scaleMultiplier += 1;
	}
	return [aw, ah, scaleMultiplier];
};

SCALE_LUT[SCALE_MODES.COVER] = function(containerWidth, containerHeight, baseWidth, baseHeight, ratio) {
	let width = containerWidth;
	let height = containerHeight;
	if ((width / height) < ratio) {
		width = Math.round(height * ratio);
	} else {
		height = Math.round(width / ratio);
	}

	return [width, height, width / baseWidth];
};

export default class Resizer {
	static get SCALE_MODES() {
		return SCALE_MODES;
	}

	constructor(baseWidth, baseHeight, scaleMode = SCALE_MODES.FIT, allowDownscale = true) {
		this.element = document.createElement('div');
		this.element.className = 'resizer';
		this.baseWidth = baseWidth;
		this.baseHeight = baseHeight;

		if (!allowDownscale) {
			this.element.style.minWidth = `${baseWidth}px`;
			this.element.style.minHeight = `${baseHeight}px`;
		}
		this.ratio = this.baseWidth / this.baseHeight;

		this.scaleMode = scaleMode;
		this.scaleMultiplier = 1;

		window.onresize = this.onResize;

		this.onResize();
	}

	onResize = () => {
		const [w, h, scaleMultiplier] = SCALE_LUT[this.scaleMode](
			this.element.offsetWidth,
			this.element.offsetHeight,
			this.baseWidth,
			this.baseHeight,
			this.ratio
		);

		Array.from(this.element.children).forEach(element => {
			element.style.width = `${w}px`;
			element.style.height = `${h}px`;
		});
		this.scaleMultiplier = scaleMultiplier;
	}

	appendChild(element) {
		this.element.appendChild(element);
		this.onResize();
	}
}
