// setup inputs
export default class Mouse {
	constructor(element, lock) {
		this.element = null;

		this.down = false;
		this.justDown = false;
		this.justUp = false;

		this.x = 0;
		this.y = 0;
		this.delta = {
			x: 0,
			y: 0
		};
		this.prev = {
			x: 0,
			y: 0
		};
		this.mouseWheel = 0;

		this.element = element;
		this.element.addEventListener("mouseup", this.onUp);
		this.element.addEventListener("mouseout", this.onUp);
		this.element.addEventListener("mousedown", this.onDown);
		this.element.addEventListener("mousemove", this.onMove);
		this.element.addEventListener("wheel", this.onWheel);
		this.lock = !!lock;
		if (this.lock) {
			this.lockMouse();
		}
	}

	lockMouse() {
		this.element.requestPointerLock = this.element.requestPointerLock || this.element.mozRequestPointerLock;
		this.element.requestPointerLock();
	}
	update() {
		this.justDown = false;
		this.justUp = false;

		this.mouseWheel = 0;

		// save old position
		this.prev.x = this.x;
		this.prev.y = this.y;
		// calculate delta position
		this.delta.x = 0;
		this.delta.y = 0;
	}

	onDown = event => {
		if (!this.down) {
			this.down = true;
			this.justDown = true;
		}
		if (this.lock) {
			this.lockMouse();
		}
	}
	onUp = event => {
		this.down = false;
		this.justDown = false;
		this.justUp = true;
	}
	onMove = event => {
		if (this.lock) {
			this.delta.x = event.movementX;
			this.delta.y = event.movementY;
			this.x += this.delta.x;
			this.y += this.delta.y;
			return;
		}
		// get new position
		this.x = event.clientX - this.element.offsetLeft;
		this.y = event.clientY - this.element.offsetTop;
		// calculate delta position
		this.delta.x = this.x - this.prev.x;
		this.delta.y = this.y - this.prev.y;
	}
	onWheel = event => {
		this.mouseWheel = event.deltaY || event.originalEvent.wheelDelta;
	}

	isDown(key) {
		return this.down;
	}
	isUp(key) {
		return !this.isDown();
	}
	isJustDown(key) {
		return this.justDown;
	}
	isJustUp(key) {
		return this.justUp;
	}

	// returns -1 when moving down, 1 when moving up, 0 when not moving
	getWheelDir() {
		return Math.sign(this.mouseWheel);
	}
}
